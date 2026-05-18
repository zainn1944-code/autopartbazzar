import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from dependencies import get_current_user, require_admin_user
from models.order import Order, OrderItem
from models.product import Product
from models.user import User
from schemas.order import OrderCreate
from services.email_service import send_order_confirmation_email

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/orders", tags=["orders"])

VALID_STATUSES = {"Pending", "Processing", "Shipped", "Delivered", "Cancelled"}


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


@router.post("")
async def create_order(
    body: OrderCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not body.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    order = Order(
        user_id=user.id,
        total_amount=body.totalAmount,
        status="Pending",
        payment_status="Pending",
        shipping_address=body.shippingAddress.model_dump(),
    )
    db.add(order)
    await db.flush()

    for line in body.items:
        if line.product is None and not line.snapshot:
            raise HTTPException(status_code=400, detail="Each order line needs a product or snapshot")

        prod = await _resolve_product(db, line.product) if line.product is not None else None
        item = OrderItem(
            order_id=order.id,
            product_id=prod.id if prod is not None else None,
            quantity=line.quantity,
            price=line.price,
            snapshot=line.snapshot
            or (
                {
                    "itemType": "catalog",
                    "name": prod.name,
                    "make": prod.make,
                    "category": prod.category,
                    "imageUrl": prod.image_url,
                    "productRef": prod.product_id,
                }
                if prod is not None
                else None
            ),
        )
        db.add(item)

    await db.commit()
    await db.refresh(order)

    items_r = await db.execute(select(OrderItem).where(OrderItem.order_id == order.id))
    lines = items_r.scalars().all()

    # Send order confirmation email (best-effort, never block the response)
    try:
        email_items = [
            {
                "name": li.snapshot.get("name", "Item") if li.snapshot else "Item",
                "quantity": li.quantity,
                "price": li.price,
            }
            for li in lines
        ]
        send_order_confirmation_email(user.email, order.id, order.total_amount, email_items)
    except Exception as exc:
        logger.warning("Order confirmation email failed: %s", exc)

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
        "totalAmount": order.total_amount,
        "status": order.status,
        "paymentStatus": order.payment_status,
        "shippingAddress": order.shipping_address,
        "orderDate": order.order_date.isoformat() if order.order_date else None,
    }


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
