from sqlalchemy import BigInteger, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class PasswordOtp(Base):
    __tablename__ = "password_otps"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    otp_hash: Mapped[str] = mapped_column(Text)
    expiry_ms: Mapped[int] = mapped_column(BigInteger)
