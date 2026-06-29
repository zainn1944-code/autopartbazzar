import random
import time

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from database import get_db
from models.otp import SignupOtp
from models.user import User
from schemas.auth import LoginRequest, Token
from schemas.user import UserCreate
from services.email_service import send_signup_otp_email
from services.jwt_tokens import create_access_token, create_refresh_token, decode_refresh_token
from services.password import hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()

_REFRESH_COOKIE = "refresh_token"
_COOKIE_OPTS = dict(httponly=True, samesite="lax", secure=False)  # set secure=True behind HTTPS

_OTP_TTL_MS = 10 * 60 * 1000  # 10 minutes


def role_for_email(email: str) -> str:
    return "admin" if email.strip().lower() == settings.admin_email.strip().lower() else "user"


class VerifySignupBody(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=4, max_length=4)


class ResendSignupBody(BaseModel):
    email: EmailStr


def _ensure_email_is_configured() -> None:
    if not settings.email_user or not settings.email_pass:
        raise HTTPException(
            status_code=503,
            detail="Signup verification email is unavailable until EMAIL_USER and EMAIL_PASS are configured.",
        )


async def _issue_signup_otp(
    db: AsyncSession, *, email: str, phone: str, password_hash: str, name: str | None = None
) -> None:
    """Create/refresh a pending SignupOtp row and email the code (atomic commit)."""
    _ensure_email_is_configured()
    otp = random.randint(1000, 9999)
    expiry = int(time.time() * 1000) + _OTP_TTL_MS

    existing = await db.execute(select(SignupOtp).where(SignupOtp.email == email))
    row = existing.scalar_one_or_none()
    if row:
        row.name = name
        row.phone = phone
        row.password_hash = password_hash
        row.otp_hash = hash_password(str(otp))
        row.expiry_ms = expiry
    else:
        db.add(
            SignupOtp(
                email=email,
                name=name,
                phone=phone,
                password_hash=password_hash,
                otp_hash=hash_password(str(otp)),
                expiry_ms=expiry,
            )
        )

    try:
        send_signup_otp_email(email, str(otp))
    except RuntimeError:
        await db.rollback()
        raise HTTPException(
            status_code=503,
            detail="Signup verification email is unavailable until EMAIL_USER and EMAIL_PASS are configured.",
        ) from None
    except Exception:
        await db.rollback()
        raise HTTPException(
            status_code=502,
            detail="Failed to send verification email. Check SMTP settings and try again.",
        ) from None

    await db.commit()


@router.post("/register", status_code=status.HTTP_202_ACCEPTED)
async def register(request: Request, body: UserCreate, db: AsyncSession = Depends(get_db)):
    """Step 1 of signup — validate, then email an OTP. No account is created yet;
    the pending registration is held in `signup_otps` until /register/verify."""
    existing = await db.execute(
        select(User).where((User.email == body.email) | (User.phone == body.phone))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email or phone already registered.")

    await _issue_signup_otp(
        db,
        email=body.email,
        phone=body.phone,
        password_hash=hash_password(body.password),
        name=(body.name or None),
    )
    return {
        "message": "Verification code sent to your email.",
        "requiresOtp": True,
        "email": body.email,
    }


@router.post("/register/verify", status_code=status.HTTP_201_CREATED)
async def verify_signup(body: VerifySignupBody, db: AsyncSession = Depends(get_db)):
    """Step 2 of signup — verify the OTP and create the real user account."""
    r = await db.execute(select(SignupOtp).where(SignupOtp.email == body.email))
    pending = r.scalar_one_or_none()
    if not pending:
        raise HTTPException(status_code=404, detail="No pending signup found. Please register again.")
    if pending.expiry_ms < int(time.time() * 1000):
        await db.delete(pending)
        await db.commit()
        raise HTTPException(status_code=400, detail="Verification code has expired. Please register again.")
    if not verify_password(body.otp, pending.otp_hash):
        raise HTTPException(status_code=400, detail="Invalid verification code.")

    # Guard against a race where the email/phone got taken between steps.
    existing = await db.execute(
        select(User).where((User.email == pending.email) | (User.phone == pending.phone))
    )
    if existing.scalar_one_or_none():
        await db.delete(pending)
        await db.commit()
        raise HTTPException(status_code=400, detail="Email or phone already registered.")

    user = User(
        email=pending.email,
        phone=pending.phone,
        password_hash=pending.password_hash,
        name=pending.name,
    )
    db.add(user)
    await db.delete(pending)
    await db.commit()
    return {"message": "Account verified and created successfully! Please log in."}


@router.post("/register/resend", status_code=status.HTTP_202_ACCEPTED)
async def resend_signup_otp(body: ResendSignupBody, db: AsyncSession = Depends(get_db)):
    """Resend the signup OTP for an in-progress registration."""
    r = await db.execute(select(SignupOtp).where(SignupOtp.email == body.email))
    pending = r.scalar_one_or_none()
    if not pending:
        raise HTTPException(status_code=404, detail="No pending signup found. Please register again.")

    await _issue_signup_otp(
        db,
        email=pending.email,
        phone=pending.phone,
        password_hash=pending.password_hash,
        name=pending.name,
    )
    return {"message": "A new verification code has been sent.", "requiresOtp": True, "email": body.email}


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
