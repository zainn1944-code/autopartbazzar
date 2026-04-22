from pydantic import BaseModel, ConfigDict, Field


class ReviewCreate(BaseModel):
    text: str = Field(min_length=1)
    rating: float = Field(ge=1, le=5)


class ReviewRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    productId: str = Field(alias="product_id")
    text: str
    rating: float
