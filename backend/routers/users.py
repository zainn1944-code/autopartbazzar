from pydantic import BaseModel, EmailStr

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User

router = APIRouter(prefix="/userExists", tags=["users"])


class UserExistsBody(BaseModel):
    email: EmailStr


@router.post("")
async def user_exists(body: UserExistsBody, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User.id).where(User.email == body.email))
    row = result.scalar_one_or_none()
    return {"user": {"_id": str(row)} if row is not None else None}
