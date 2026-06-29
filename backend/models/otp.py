from sqlalchemy import BigInteger, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class PasswordOtp(Base):
    __tablename__ = "password_otps"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    otp_hash: Mapped[str] = mapped_column(Text)
    expiry_ms: Mapped[int] = mapped_column(BigInteger)


class SignupOtp(Base):
    """Holds a *pending* registration until its OTP is verified.

    We store the already-hashed password here (never plaintext) so the real
    `users` row is only created once the email is proven to belong to the user.
    """

    __tablename__ = "signup_otps"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str] = mapped_column(String(64))
    password_hash: Mapped[str] = mapped_column(String(255))
    otp_hash: Mapped[str] = mapped_column(Text)
    expiry_ms: Mapped[int] = mapped_column(BigInteger)
