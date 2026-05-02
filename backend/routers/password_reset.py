import random
import re
import time

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from database import get_db
from models.otp import PasswordOtp
from models.user import User
from services.email_service import send_otp_email
from services.password import hash_password, verify_password

router = APIRouter(tags=["password"])


class EmailBody(BaseModel):
    email: EmailStr


class VerifyBody(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=4, max_length=4)


class UpdatePassBody(BaseModel):
    email: EmailStr
    newPassword: str = Field(min_length=1)
    confirmPassword: str = Field(min_length=1)


def _ensure_email_is_configured() -> None:
    settings = get_settings()
    if not settings.email_user or not settings.email_pass:
        raise HTTPException(
            status_code=503,
            detail="Password reset email is unavailable until EMAIL_USER and EMAIL_PASS are configured.",
        )


@router.post("/generateOTP")
async def generate_otp(body: EmailBody, db: AsyncSession = Depends(get_db)):
    if not re.match(r"\S+@\S+\.\S+", body.email):
        raise HTTPException(status_code=400, detail="Invalid email address.")

    r = await db.execute(select(User).where(User.email == body.email))
    if r.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Email not found.")

    _ensure_email_is_configured()
    otp = random.randint(1000, 9999)
    hashed = hash_password(str(otp))
    expiry = int(time.time() * 1000) + 10 * 60 * 1000

    existing = await db.execute(select(PasswordOtp).where(PasswordOtp.email == body.email))
    row = existing.scalar_one_or_none()
    if row:
        row.otp_hash = hashed
        row.expiry_ms = expiry
    else:
        db.add(PasswordOtp(email=body.email, otp_hash=hashed, expiry_ms=expiry))

    try:
        send_otp_email(body.email, str(otp))
    except RuntimeError:
        await db.rollback()
        raise HTTPException(
            status_code=503,
            detail="Password reset email is unavailable until EMAIL_USER and EMAIL_PASS are configured.",
        ) from None
    except Exception:
        await db.rollback()
        raise HTTPException(
            status_code=502,
            detail="Failed to send OTP email. Check SMTP settings and try again.",
        ) from None

    await db.commit()

    return {"success": True, "message": "OTP sent successfully."}


@router.post("/verifyOTP")
async def verify_otp(body: VerifyBody, db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(PasswordOtp).where(PasswordOtp.email == body.email))
    row = r.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="OTP not found.")

    if row.expiry_ms < int(time.time() * 1000):
        raise HTTPException(status_code=400, detail="OTP has expired.")

    if not verify_password(body.otp, row.otp_hash):
        raise HTTPException(status_code=400, detail="Invalid OTP.")

    await db.delete(row)
    await db.commit()
    return {"success": True, "message": "OTP verified successfully."}


@router.post("/resendOTP")
async def resend_otp(body: EmailBody, db: AsyncSession = Depends(get_db)):
    return await generate_otp(body, db)


@router.post("/updatePass")
async def update_pass(body: UpdatePassBody, db: AsyncSession = Depends(get_db)):
    if body.newPassword != body.confirmPassword:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    r = await db.execute(select(User).where(User.email == body.email))
    user = r.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")

    user.password_hash = hash_password(body.newPassword)
    await db.commit()
    return {"success": True, "message": "Password updated successfully."}
