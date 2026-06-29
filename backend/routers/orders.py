import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from config import get_settings
from database import get_db
from dependencies import get_current_user, require_admin_user
from models.order import Order, OrderItem
from models.product import Product
from models.user import User
from schemas.order import OrderCreate
from services.email_service import send_order_confirmation_email
from services.payment_service import build_jazzcash_payment, build_mock_payment

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/orders", tags=["orders"])

VALID_STATUSES = {"Pending", "Processing", "Shipped", "Delivered", "Cancelled"}
VALID_PAYMENT_METHODS = {"COD", "JazzCash"}
FLAT_SHIPPING_RATE = 250


def _serialize_order(order: Order, lines: list[OrderItem], payment: dict | None = None) -> dict:
    subtotal = sum(float(li.price) * li.quantity for li in lines)
    shipping_amount = FLAT_SHIPPING_RATE if subtotal > 0 else 0
    return {
        "id": order.id,
        "_id": str(order.id),
        "user": order.user_id,
        "items": [
            {
                "product": li.product_id,
                "quantity": li.quantity,
                "price": li.price,
                "snapshot": li.snapshot,
            }
            for li in lines
        ],
        "subtotalAmount": subtotal,
        "shippingAmount": shipping_amount,
        "totalAmount": order.total_amount,
        "status": order.status,
        "paymentStatus": order.payment_status,
        "paymentMethod": order.payment_method,
        "shippingAddress": order.shipping_address,
        "orderDate": order.order_date.isoformat() if order.order_date else None,
        # Present only for online payment — frontend auto-submits this to JazzCash.
        "payment": payment,
    }


async def _order_with_items(db: AsyncSession, order: Order) -> dict:
    r = await db.execute(select(OrderItem).where(OrderItem.order_id == order.id))
    return _serialize_order(order, r.scalars().all())


async def notify_order_confirmed(db: AsyncSession, order: Order) -> None:
    """Send the order-confirmation email (best-effort, never raises)."""
    try:
        items_r = await db.execute(select(OrderItem).where(OrderItem.order_id == order.id))
        lines = items_r.scalars().all()
        user_r = await db.execute(select(User).where(User.id == order.user_id))
        user = user_r.scalar_one_or_none()
        if user is None or not user.email:
            return
        email_items = [
            {
                "name": li.snapshot.get("name", "Item") if li.snapshot else "Item",
                "quantity": li.quantity,
                "price": li.price,
            }
            for li in lines
        ]
        subtotal = sum(float(li.price) * li.quantity for li in lines)
        shipping_fee = FLAT_SHIPPING_RATE if subtotal > 0 else 0
        send_order_confirmation_email(
            user.email,
            order.id,
            order.total_amount,
            email_items,
            shipping_address=order.shipping_address,
            subtotal=subtotal,
            shipping_fee=shipping_fee,
            payment_method=order.payment_method,
        )
    except Exception as exc:  # pragma: no cover - email is non-critical
        logger.warning("Order confirmation email failed: %s", exc)


class OrderStatusUpdate(BaseModel):
    status: str


async def _resolve_product(db: AsyncSession, ref: str | int) -> Product:
    s = str(ref).strip()
    if s.isdigit():
        r = await db.execute(
            select(Product).where((Product.id == int(s)) | (Product.product_id == s))
        )
    else:
        r = await db.execute(select(Product).where(Product.product_id == s))
    p = r.scalar_one_or_none()
    if p is None:
        raise HTTPException(status_code=400, detail=f"Invalid product reference: {ref}")
    return p


def _build_item_snapshot(line: OrderItem, product: Product | None = None) -> dict | None:
    if line.snapshot:
        return line.snapshot
    if product is None:
        return None
    return {
        "itemType": "catalog",
        "name": product.name,
        "make": product.make,
        "category": product.category,
        "imageUrl": product.image_url,
        "productRef": product.product_id,
    }


def _catalog_snapshot(product: Product) -> dict:
    return {
        "itemType": "catalog",
        "name": product.name,
        "make": product.make,
        "category": product.category,
        "imageUrl": product.image_url,
        "productRef": product.product_id,
    }


def _snapshot_price(snapshot: dict | None, fallback_price: float) -> float:
    if not snapshot:
        return float(fallback_price)

    selected_parts = snapshot.get("selectedParts")
    if not isinstance(selected_parts, list) or not selected_parts:
        return float(fallback_price)

    return sum(float(part.get("price") or 0) for part in selected_parts)


@router.post("")
async def create_order(
    body: OrderCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not body.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    payment_method = body.paymentMethod or "COD"
    if payment_method not in VALID_PAYMENT_METHODS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid payment method. Must be one of: {', '.join(VALID_PAYMENT_METHODS)}",
        )
    online_provider = None
    if payment_method == "JazzCash":
        online_provider = get_settings().online_payment_provider
        if online_provider is None:
            raise HTTPException(
                status_code=503,
                detail="Online payment is not available right now. Please choose Cash on Delivery.",
            )

    # Idempotency: a retried submit with the same key returns the original order
    # instead of creating a duplicate (and re-charging / re-decrementing stock).
    idem_key = (body.idempotencyKey or "").strip() or None
    if idem_key:
        existing = (
            await db.execute(
                select(Order).where(
                    Order.idempotency_key == idem_key,
                    Order.user_id == user.id,
                )
            )
        ).scalar_one_or_none()
        if existing is not None:
            return await _order_with_items(db, existing)

    prepared_items = []
    subtotal = 0.0

    for line in body.items:
        if line.product is None and not line.snapshot:
            raise HTTPException(status_code=400, detail="Each order line needs a product or snapshot")

        prod = await _resolve_product(db, line.product) if line.product is not None else None

        if prod is not None:
            if prod.is_live_listing:
                raise HTTPException(
                    status_code=400,
                    detail=f"{prod.name} is an external listing and cannot be checked out here",
                )
            if prod.stock_quantity < line.quantity:
                raise HTTPException(
                    status_code=409,
                    detail=f"Only {prod.stock_quantity} units available for {prod.name}",
                )
            unit_price = float(prod.price)
            snapshot = _catalog_snapshot(prod)
        else:
            unit_price = _snapshot_price(line.snapshot, line.price)
            snapshot = line.snapshot

        subtotal += unit_price * line.quantity
        prepared_items.append(
            {
                "product": prod,
                "quantity": line.quantity,
                "price": unit_price,
                "snapshot": snapshot,
            }
        )

    shipping_amount = FLAT_SHIPPING_RATE if subtotal > 0 else 0
    total_amount = subtotal + shipping_amount

    order = Order(
        user_id=user.id,
        total_amount=total_amount,
        status="Pending",
        payment_status="Pending",
        payment_method=payment_method,
        idempotency_key=idem_key,
        shipping_address=body.shippingAddress.model_dump(),
    )
    db.add(order)
    await db.flush()

    for line in prepared_items:
        prod = line["product"]
        if prod is not None:
            prod.stock_quantity -= line["quantity"]
        item = OrderItem(
            order_id=order.id,
            product_id=prod.id if prod is not None else None,
            quantity=line["quantity"],
            price=line["price"],
            snapshot=line["snapshot"],
        )
        db.add(item)

    try:
        await db.commit()
    except IntegrityError:
        # Concurrent duplicate submit raced us on the unique idempotency key.
        await db.rollback()
        if idem_key:
            existing = (
                await db.execute(
                    select(Order).where(
                        Order.idempotency_key == idem_key,
                        Order.user_id == user.id,
                    )
                )
            ).scalar_one_or_none()
            if existing is not None:
                return await _order_with_items(db, existing)
        raise
    await db.refresh(order)

    items_r = await db.execute(select(OrderItem).where(OrderItem.order_id == order.id))
    lines = items_r.scalars().all()

    # For COD the order is final now, so send the confirmation email immediately.
    # For online payment we wait until the gateway confirms (callback / mock-complete).
    payment = None
    if payment_method == "JazzCash":
        if online_provider == "jazzcash":
            description = f"Auto Part Bazar order #{order.id}"
            payment = build_jazzcash_payment(order.id, order.total_amount, description)
        else:  # built-in demo gateway
            payment = build_mock_payment(order.id, order.total_amount)
    else:
        await notify_order_confirmed(db, order)

    return _serialize_order(order, lines, payment=payment)


@router.get("/me")
async def list_my_orders(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Order)
        .where(Order.user_id == user.id)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .order_by(Order.id.desc())
    )
    orders = result.scalars().all()

    response = []
    for order in orders:
        response.append(
            {
                "id": order.id,
                "_id": str(order.id),
                "totalAmount": order.total_amount,
                "status": order.status,
                "paymentStatus": order.payment_status,
                "shippingAddress": order.shipping_address,
                "orderDate": order.order_date.isoformat() if order.order_date else None,
                "items": [
                    {
                        "product": item.product_id,
                        "quantity": item.quantity,
                        "price": item.price,
                        "snapshot": _build_item_snapshot(item, item.product),
                    }
                    for item in order.items
                ],
            }
        )
    return {"orders": response}


@router.get("/all")
async def list_all_orders(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin_user),
):
    """Admin: get every order with user info."""
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.product), selectinload(Order.user))
        .order_by(Order.id.desc())
    )
    orders = result.scalars().all()
    response = []
    for order in orders:
        response.append(
            {
                "id": order.id,
                "_id": str(order.id),
                "totalAmount": order.total_amount,
                "status": order.status,
                "paymentStatus": order.payment_status,
                "shippingAddress": order.shipping_address,
                "orderDate": order.order_date.isoformat() if order.order_date else None,
                "user": {
                    "id": order.user.id,
                    "email": order.user.email,
                    "name": order.user.name,
                } if order.user else None,
                "items": [
                    {
                        "product": item.product_id,
                        "quantity": item.quantity,
                        "price": item.price,
                        "snapshot": _build_item_snapshot(item, item.product),
                    }
                    for item in order.items
                ],
            }
        )
    return {"orders": response}


@router.patch("/{order_id}/status")
async def update_order_status(
    order_id: int,
    body: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin_user),
):
    """Admin: update order status."""
    if body.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(VALID_STATUSES)}",
        )
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = body.status
    await db.commit()
    await db.refresh(order)
    return {"message": "Order status updated", "id": order.id, "status": order.status}
