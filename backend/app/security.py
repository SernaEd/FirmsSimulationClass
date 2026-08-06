"""Utilidades de seguridad: hash de PIN + firma y verificación de JWT."""

from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

# ---- Hash de PIN con bcrypt (cost factor >= 12, §13) ----
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)


def hash_pin(pin: str) -> str:
    return _pwd_context.hash(pin)


def verify_pin(pin: str, pin_hash: str) -> bool:
    try:
        return _pwd_context.verify(pin, pin_hash)
    except ValueError:
        return False


# ---- JWT ----
def create_access_token(subject: str | int, extra_claims: dict[str, Any] | None = None) -> str:
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=settings.jwt_access_token_minutes)).timestamp()),
        "type": "access",
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict[str, Any]:
    """Devuelve el payload si es válido; lanza JWTError si no."""
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])


# Re-export para que otros módulos puedan capturar el error
__all__ = ["hash_pin", "verify_pin", "create_access_token", "decode_token", "JWTError"]
