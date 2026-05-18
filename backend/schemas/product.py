from datetime import datetime

from pydantic import BaseModel, ConfigDict

from models.product import Product


class ProductResponse(BaseModel):
    id: int
    _id: str
    productId: str
    name: str
    description: str | None = None
    price: float
    originalPrice: float | None = None
    category: str
    make: str | None = None
    city: str | None = None
    sale: bool = False
    freeShipping: bool = False
    stockQuantity: int = 0
    imageUrl: str | None = None
    modelUrl: str | None = None
    sourceName: str | None = None
    sourceUrl: str | None = None
    externalId: str | None = None
    isLiveListing: bool = False
    lastSyncedAt: datetime | None = None

    @classmethod
    def from_product(cls, p: Product) -> "ProductResponse":
        return cls(
            id=p.id,
            _id=str(p.id),
            productId=p.product_id,
            name=p.name,
            description=p.description,
            price=p.price,
            originalPrice=p.original_price,
            category=p.category,
            make=p.make,
            city=p.city,
            sale=p.sale,
            freeShipping=p.free_shipping,
            stockQuantity=p.stock_quantity,
            imageUrl=p.image_url,
            modelUrl=p.model_url,
            sourceName=p.source_name,
            sourceUrl=p.source_url,
            externalId=p.external_id,
            isLiveListing=p.is_live_listing,
            lastSyncedAt=p.last_synced_at,
        )


class ProductUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    productId: str | None = None
    name: str | None = None
    description: str | None = None
    price: float | None = None
    originalPrice: float | None = None
    category: str | None = None
    make: str | None = None
    city: str | None = None
    sale: bool | None = None
    freeShipping: bool | None = None
    stockQuantity: int | None = None
    modelUrl: str | None = None
    sourceName: str | None = None
    sourceUrl: str | None = None
