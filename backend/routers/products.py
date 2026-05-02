from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.product import Product
from schemas.product import ProductResponse, ProductUpdate
from services.s3_upload import store_product_image

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
async def list_products(db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(Product).order_by(Product.id.asc()))
    rows = r.scalars().all()
    return {"products": [ProductResponse.from_product(p).model_dump() for p in rows]}


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
    name: str = Form(...),
    price: str = Form(...),
    originalPrice: str | None = Form(None),
    category: str = Form(...),
    make: str = Form(""),
    city: str = Form(""),
    sale: str = Form("false"),
    freeShipping: str = Form("false"),
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
        price=price_f,
        original_price=op,
        category=category,
        make=make or None,
        city=city or None,
        sale=sale == "true",
        free_shipping=freeShipping == "true",
        image_url=image_url or None,
    )
    db.add(new_p)
    await db.commit()
    await db.refresh(new_p)
    return {"message": "Product added successfully!", "product": ProductResponse.from_product(new_p).model_dump()}


@router.put("")
async def update_product(body: ProductUpdate, db: AsyncSession = Depends(get_db)):
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
        "price": "price",
        "originalPrice": "original_price",
        "category": "category",
        "make": "make",
        "city": "city",
        "sale": "sale",
        "freeShipping": "free_shipping",
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
async def remove_product(body: RemoveProductBody, db: AsyncSession = Depends(get_db)):
    if not body.productId:
        raise HTTPException(status_code=400, detail="Product ID is required")
    p = await _get_product_by_ref(db, body.productId)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    await db.delete(p)
    await db.commit()
    return {"message": "Product deleted successfully"}
