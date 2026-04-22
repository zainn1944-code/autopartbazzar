from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    phone: str = Field(min_length=1)
    password: str = Field(min_length=1)


class UserRead(BaseModel):
    id: int
    email: str
    phone: str

    model_config = {"from_attributes": True}


class UserExistsResponse(BaseModel):
    user: dict | None = None
