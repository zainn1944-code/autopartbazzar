from pydantic import BaseModel, ConfigDict, Field

from models.product import Product


class ProductResponse(BaseModel):
    id: int
    _id: str
    productId: str
    name: str
    price: float
    originalPrice: float | None = None
    category: str
    make: str | None = None
    city: str | None = None
    sale: bool = False
    freeShipping: bool = False
    imageUrl: str | None = None
    modelUrl: str | None = None

    @classmethod
    def from_product(cls, p: Product) -> "ProductResponse":
        return cls(
            id=p.id,
            _id=str(p.id),
            productId=p.product_id,
            name=p.name,
            price=p.price,
            originalPrice=p.original_price,
            category=p.category,
            make=p.make,
            city=p.city,
            sale=p.sale,
            freeShipping=p.free_shipping,
            imageUrl=p.image_url,
            modelUrl=p.model_url,
        )


class ProductUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    productId: str | None = None
    name: str | None = None
    price: float | None = None
    originalPrice: float | None = None
    category: str | None = None
    make: str | None = None
    city: str | None = None
    sale: bool | None = None
    freeShipping: bool | None = None
