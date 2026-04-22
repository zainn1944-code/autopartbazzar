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
