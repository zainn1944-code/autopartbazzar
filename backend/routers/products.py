import csv
import io

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies import require_admin_user
from database import get_db
from models.product import Product
from schemas.product import ProductResponse, ProductUpdate
from services.s3_upload import store_product_image
from services.parts_sync import fetch_and_store_daily_parts, get_last_sync_report

router = APIRouter(prefix="/products", tags=["products"])


async def _get_product_by_ref(db: AsyncSession, ref: str) -> Product | None:
    if ref.isdigit():
        r = await db.execute(
            select(Product).where((Product.id == int(ref)) | (Product.product_id == ref))
        )
    else:
        r = await db.execute(select(Product).where(Product.product_id == ref))
    return r.scalar_one_or_none()


async def _next_product_id(db: AsyncSession) -> str:
    r = await db.execute(select(Product.product_id))
    numeric_ids = [int(product_id) for product_id in r.scalars().all() if product_id and product_id.isdigit()]
    return str(max(numeric_ids, default=0) + 1)


@router.get("")
async def list_products(
    db: AsyncSession = Depends(get_db),
    q: str | None = Query(None),
    category: str | None = Query(None),
    make: str | None = Query(None),
    city: str | None = Query(None),
    sourceName: str | None = Query(None),
    sale: bool | None = Query(None),
    freeShipping: bool | None = Query(None),
    liveOnly: bool | None = Query(None),
    minPrice: float | None = Query(None, ge=0),
    maxPrice: float | None = Query(None, ge=0),
    hasModelUrl: bool | None = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(9, ge=1, le=48),
    sortBy: str = Query("latest"),
):
    filters = []
    if q:
        pattern = f"%{q.strip()}%"
        filters.append(
            or_(
                Product.name.ilike(pattern),
                Product.category.ilike(pattern),
                Product.make.ilike(pattern),
                Product.city.ilike(pattern),
            )
        )
    if category:
        filters.append(Product.category == category)
    if make:
        filters.append(Product.make == make)
    if city:
        filters.append(Product.city == city)
    if sourceName:
        filters.append(Product.source_name == sourceName)
    if sale is not None:
        filters.append(Product.sale == sale)
    if freeShipping is not None:
        filters.append(Product.free_shipping == freeShipping)
    if liveOnly is not None:
        filters.append(Product.is_live_listing == liveOnly)
    if minPrice is not None:
        filters.append(Product.price >= minPrice)
    if maxPrice is not None:
        filters.append(Product.price <= maxPrice)
    if hasModelUrl is True:
        filters.append(Product.model_url.is_not(None))
        filters.append(Product.model_url != "")
    elif hasModelUrl is False:
        filters.append(or_(Product.model_url.is_(None), Product.model_url == ""))

    order_by = {
        "priceLow": Product.price.asc(),
        "priceHigh": Product.price.desc(),
        "name": Product.name.asc(),
        "latest": Product.id.desc(),
    }.get(sortBy, Product.id.desc())

    base_query = select(Product)
    count_query = select(func.count()).select_from(Product)
    for condition in filters:
        base_query = base_query.where(condition)
        count_query = count_query.where(condition)

    total = (await db.execute(count_query)).scalar_one()
    rows = (
        await db.execute(
            base_query.order_by(order_by).offset((page - 1) * pageSize).limit(pageSize)
        )
    ).scalars().all()

    filter_rows = (
        await db.execute(
            select(Product.category, Product.make, Product.city, Product.source_name).order_by(Product.id.asc())
        )
    ).all()
    categories = sorted({row[0] for row in filter_rows if row[0]})
    makes = sorted({row[1] for row in filter_rows if row[1]})
    cities = sorted({row[2] for row in filter_rows if row[2]})
    sources = sorted({row[3] for row in filter_rows if row[3]})

    return {
        "products": [ProductResponse.from_product(p).model_dump() for p in rows],
        "meta": {
            "page": page,
            "pageSize": pageSize,
            "total": total,
            "totalPages": max(1, (total + pageSize - 1) // pageSize),
            "availableFilters": {
                "categories": categories,
                "makes": makes,
                "cities": cities,
                "sources": sources,
            },
        },
    }


@router.get("/sync/status")
async def get_live_sync_status(_: object = Depends(require_admin_user)):
    return get_last_sync_report()


@router.post("/sync/live")
async def trigger_live_sync(_: object = Depends(require_admin_user)):
    return await fetch_and_store_daily_parts(triggered_by="admin-api")


@router.get("/{product_ref}")
async def get_product(product_ref: str, db: AsyncSession = Depends(get_db)):
    p = await _get_product_by_ref(db, product_ref)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductResponse.from_product(p).model_dump()


@router.post("")
async def add_product(
    request: Request,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_admin_user),
    name: str = Form(...),
    price: str = Form(...),
    originalPrice: str | None = Form(None),
    category: str = Form(...),
    make: str = Form(""),
    city: str = Form(""),
    sale: str = Form("false"),
    freeShipping: str = Form("false"),
    stockQuantity: str = Form("0"),
    description: str | None = Form(None),
    modelUrl: str | None = Form(None),
    sourceName: str | None = Form(None),
    sourceUrl: str | None = Form(None),
    image: UploadFile | None = File(None),
):
    try:
        price_f = float(price)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid price")
    if price_f <= 0:
        raise HTTPException(status_code=400, detail="Price must be greater than 0.")

    try:
        op = float(originalPrice) if originalPrice not in (None, "") else None
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid original price")
    if op is not None and price_f > op:
        raise HTTPException(status_code=400, detail="Price must be <= original price.")

    try:
        stock_qty = int(stockQuantity) if stockQuantity not in (None, "") else 0
    except ValueError:
        stock_qty = 0

    product_id = await _next_product_id(db)

    image_url = ""
    if image is not None and getattr(image, "filename", None):
        content = await image.read()
        if len(content) > 0:
            try:
                image_url = store_product_image(
                    content,
                    image.content_type or "application/octet-stream",
                    image.filename or "image",
                    str(request.base_url),
                )
            except RuntimeError as e:
                raise HTTPException(status_code=500, detail=str(e)) from e

    new_p = Product(
        product_id=product_id,
        name=name,
        description=description or None,
        price=price_f,
        original_price=op,
        category=category,
        make=make or None,
        city=city or None,
        sale=sale == "true",
        free_shipping=freeShipping == "true",
        stock_quantity=stock_qty,
        image_url=image_url or None,
        model_url=modelUrl or None,
        source_name=sourceName or None,
        source_url=sourceUrl or None,
    )
    db.add(new_p)
    await db.commit()
    await db.refresh(new_p)
    return {"message": "Product added successfully!", "product": ProductResponse.from_product(new_p).model_dump()}


@router.put("")
async def update_product(
    body: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_admin_user),
):
    pid = body.productId
    if not pid:
        raise HTTPException(status_code=400, detail="Product ID is required")

    p = await _get_product_by_ref(db, str(pid))
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")

    data = body.model_dump(exclude_unset=True)
    if "productId" in data:
        del data["productId"]
    field_map = {
        "name": "name",
        "description": "description",
        "price": "price",
        "originalPrice": "original_price",
        "category": "category",
        "make": "make",
        "city": "city",
        "sale": "sale",
        "freeShipping": "free_shipping",
        "stockQuantity": "stock_quantity",
        "modelUrl": "model_url",
        "sourceName": "source_name",
        "sourceUrl": "source_url",
    }
    for json_key, attr in field_map.items():
        if json_key in data and data[json_key] is not None:
            setattr(p, attr, data[json_key])

    await db.commit()
    await db.refresh(p)
    return {"message": "Product updated successfully!", "product": ProductResponse.from_product(p).model_dump()}


from pydantic import BaseModel


class RemoveProductBody(BaseModel):
    productId: str


@router.delete("")
async def remove_product(
    body: RemoveProductBody,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_admin_user),
):
    if not body.productId:
        raise HTTPException(status_code=400, detail="Product ID is required")
    p = await _get_product_by_ref(db, body.productId)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    await db.delete(p)
    await db.commit()
    return {"message": "Product deleted successfully"}


# ── Bulk CSV Upload ────────────────────────────────────────────────────────────
# Expected CSV columns: name, price, category, make, city, sale, free_shipping,
#                       stock_quantity, original_price, description
# All columns except name, price, category are optional.

@router.post("/bulk-upload")
async def bulk_upload_products(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(require_admin_user),
):
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted")

    content = await file.read()
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="CSV must be UTF-8 encoded")

    reader = csv.DictReader(io.StringIO(text))
    required = {"name", "price", "category"}
    if reader.fieldnames is None or not required.issubset({f.strip() for f in reader.fieldnames}):
        raise HTTPException(
            status_code=400,
            detail=f"CSV must contain columns: {', '.join(required)}",
        )

    created, errors = [], []
    for i, row in enumerate(reader, start=2):  # row 1 = header
        row = {k.strip(): v.strip() for k, v in row.items() if k}
        try:
            price_f = float(row["price"])
            if price_f <= 0:
                raise ValueError("price must be > 0")
        except (ValueError, KeyError) as exc:
            errors.append({"row": i, "error": str(exc)})
            continue

        op_raw = row.get("original_price", "")
        try:
            op = float(op_raw) if op_raw else None
        except ValueError:
            op = None

        stock_raw = row.get("stock_quantity", "0")
        try:
            stock_qty = int(stock_raw) if stock_raw else 0
        except ValueError:
            stock_qty = 0

        product_id = await _next_product_id(db)
        p = Product(
            product_id=product_id,
            name=row.get("name", ""),
            description=row.get("description") or None,
            price=price_f,
            original_price=op,
            category=row.get("category", ""),
            make=row.get("make") or None,
            city=row.get("city") or None,
            sale=row.get("sale", "false").lower() == "true",
            free_shipping=row.get("free_shipping", "false").lower() == "true",
            stock_quantity=stock_qty,
        )
        db.add(p)
        await db.flush()
        created.append({"row": i, "product_id": product_id, "name": p.name})

    await db.commit()
    return {
        "message": f"{len(created)} products created, {len(errors)} rows skipped",
        "created": created,
        "errors": errors,
    }
