from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from database import get_db
from models.user import User
from schemas.auth import LoginRequest, Token
from schemas.user import UserCreate
from services.jwt_tokens import create_access_token, create_refresh_token, decode_refresh_token
from services.password import hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()

_REFRESH_COOKIE = "refresh_token"
_COOKIE_OPTS = dict(httponly=True, samesite="lax", secure=False)  # set secure=True behind HTTPS


def role_for_email(email: str) -> str:
    return "admin" if email.strip().lower() == settings.admin_email.strip().lower() else "user"


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(request: Request, body: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(
        select(User).where((User.email == body.email) | (User.phone == body.phone))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email or phone already registered.")

    user = User(
        email=body.email,
        phone=body.phone,
        password_hash=hash_password(body.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return {"message": "User registered successfully!"}


@router.post("/login", response_model=Token)
async def login(request: Request, body: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    role = role_for_email(user.email)
    access_token = create_access_token(subject=str(user.id), email=user.email, role=role)
    refresh_token = create_refresh_token(subject=str(user.id))

    # Set httpOnly refresh token cookie
    response.set_cookie(
        key=_REFRESH_COOKIE,
        value=refresh_token,
        max_age=settings.refresh_token_expire_days * 86400,
        **_COOKIE_OPTS,
    )
    return Token(access_token=access_token)


@router.post("/refresh", response_model=Token)
async def refresh_access_token(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    """Issues a new access token using the httpOnly refresh token cookie."""
    token = request.cookies.get(_REFRESH_COOKIE)
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")

    user_id = decode_refresh_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    role = role_for_email(user.email)
    new_access = create_access_token(subject=str(user.id), email=user.email, role=role)

    # Rotate the refresh token too
    new_refresh = create_refresh_token(subject=str(user.id))
    response.set_cookie(
        key=_REFRESH_COOKIE,
        value=new_refresh,
        max_age=settings.refresh_token_expire_days * 86400,
        **_COOKIE_OPTS,
    )
    return Token(access_token=new_access)


@router.post("/logout")
async def logout(response: Response):
    """Clears the refresh token cookie."""
    response.delete_cookie(key=_REFRESH_COOKIE, **_COOKIE_OPTS)
    return {"message": "Logged out successfully"}
