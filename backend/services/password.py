from passlib.context import CryptContext

# Use a pure-passlib scheme to avoid the bcrypt backend issue currently breaking
# registration on this environment.
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password[:72])


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain[:72], hashed)
