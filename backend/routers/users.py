from pydantic import BaseModel, EmailStr

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import get_current_user, require_admin_user
from models.user import User

router = APIRouter(tags=["users"])


class UserExistsBody(BaseModel):
    email: EmailStr


class UserProfileUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None


# ── Public: check if email exists ─────────────────────────────────────────────

@router.post("/userExists")
async def user_exists(body: UserExistsBody, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User.id).where(User.email == body.email))
    row = result.scalar_one_or_none()
    return {"user": {"_id": str(row)} if row is not None else None}


# ── Authenticated: own profile ─────────────────────────────────────────────────

@router.get("/users/me")
async def get_my_profile(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "email": user.email,
        "phone": user.phone,
        "name": user.name,
        "role": "admin" if hasattr(user, "_role") else "user",
    }


@router.put("/users/me")
async def update_my_profile(
    body: UserProfileUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if body.name is not None:
        user.name = body.name.strip()
    if body.phone is not None:
        # check uniqueness
        existing = await db.execute(
            select(User).where(User.phone == body.phone, User.id != user.id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Phone number already in use")
        user.phone = body.phone
    await db.commit()
    await db.refresh(user)
    return {"message": "Profile updated", "name": user.name, "phone": user.phone}


# ── Admin: user management ─────────────────────────────────────────────────────

@router.get("/admin/users")
async def list_users(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin_user),
):
    result = await db.execute(select(User).order_by(User.id.asc()))
    users = result.scalars().all()
    return {
        "users": [
            {
                "id": u.id,
                "email": u.email,
                "phone": u.phone,
                "name": u.name,
                "is_banned": u.is_banned,
            }
            for u in users
        ]
    }


@router.post("/admin/users/{user_id}/ban")
async def ban_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin_user),
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot ban yourself")
    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if target is None:
        raise HTTPException(status_code=404, detail="User not found")
    target.is_banned = True
    await db.commit()
    return {"message": f"User {target.email} has been banned"}


@router.post("/admin/users/{user_id}/unban")
async def unban_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin_user),
):
    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if target is None:
        raise HTTPException(status_code=404, detail="User not found")
    target.is_banned = False
    await db.commit()
    return {"message": f"User {target.email} has been unbanned"}
