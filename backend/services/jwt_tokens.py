import time

from jose import JWTError, jwt
from pydantic import ValidationError

from config import get_settings
from schemas.auth import TokenPayload

settings = get_settings()


def create_access_token(*, subject: str, email: str, role: str) -> str:
    exp = int(time.time()) + settings.access_token_expire_minutes * 60
    to_encode = {
        "sub": subject,
        "email": email,
        "role": role,
        "exp": exp,
        "type": "access",
    }
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def create_refresh_token(*, subject: str) -> str:
    exp = int(time.time()) + settings.refresh_token_expire_days * 86400
    to_encode = {
        "sub": subject,
        "exp": exp,
        "type": "refresh",
    }
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str) -> TokenPayload | None:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return TokenPayload.model_validate(
            {"sub": str(payload.get("sub")), "email": payload.get("email"), "role": payload.get("role")}
        )
    except (JWTError, ValidationError):
        return None


def decode_refresh_token(token: str) -> str | None:
    """Decodes a refresh token and returns the subject (user_id) or None if invalid."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        if payload.get("type") != "refresh":
            return None
        sub = payload.get("sub")
        return str(sub) if sub else None
    except JWTError:
        return None
