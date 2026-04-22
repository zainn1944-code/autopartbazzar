from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import get_current_user
from models.order import Order, OrderItem
from models.product import Product
from models.user import User
from schemas.order import OrderCreate

router = APIRouter(prefix="/orders", tags=["orders"])


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
        prod = await _resolve_product(db, line.product)
        item = OrderItem(
            order_id=order.id,
            product_id=prod.id,
            quantity=line.quantity,
            price=line.price,
        )
        db.add(item)

    await db.commit()
    await db.refresh(order)

    items_r = await db.execute(select(OrderItem).where(OrderItem.order_id == order.id))
    lines = items_r.scalars().all()
    return {
        "id": order.id,
        "_id": str(order.id),
        "user": order.user_id,
        "items": [
            {"product": li.product_id, "quantity": li.quantity, "price": li.price} for li in lines
        ],
        "totalAmount": order.total_amount,
        "status": order.status,
        "paymentStatus": order.payment_status,
        "shippingAddress": order.shipping_address,
        "orderDate": order.order_date.isoformat() if order.order_date else None,
    }
