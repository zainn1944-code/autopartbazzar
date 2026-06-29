from datetime import datetime

from pydantic import BaseModel, Field


class ShippingAddress(BaseModel):
    fullName: str
    phone: str
    address: str
    city: str
    postalCode: str
    country: str


class OrderItemCreate(BaseModel):
    product: str | int | None = None
    quantity: int = Field(ge=1)
    price: float = Field(ge=0)
    snapshot: dict | None = None


class OrderCreate(BaseModel):
    items: list[OrderItemCreate]
    totalAmount: float
    shippingAddress: ShippingAddress
    paymentMethod: str = "COD"  # "COD" or "JazzCash"
    idempotencyKey: str | None = None  # client-generated; dedupes retried submits


class OrderRead(BaseModel):
    id: int
    user_id: int | None
    total_amount: float
    status: str
    payment_status: str
    shipping_address: dict
    order_date: datetime | None = None

    model_config = {"from_attributes": True}
