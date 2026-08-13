"""Dependencias comunes de FastAPI."""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserStatus
from app.security import JWTError, decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Falta token de autenticación.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = decode_token(token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_raw = payload.get("sub")
    if not user_id_raw:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token sin subject.")

    user = db.get(User, int(user_id_raw))
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no existe.")

    return user


def get_current_active_user(user: User = Depends(get_current_user)) -> User:
    if user.estado != UserStatus.active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Cuenta en estado '{user.estado.value}'. Espera aprobación del profesor.",
        )
    return user


def get_current_admin(user: User = Depends(get_current_active_user)) -> User:
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requiere permisos de administrador.",
        )
    return user


def get_current_pending_profile_user(user: User = Depends(get_current_user)) -> User:
    """Puerta para el test de perfil (§3): solo accesible mientras la cuenta
    está en pending_profile (antes de que el profesor la apruebe)."""
    if user.estado != UserStatus.pending_profile:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El test de perfil ya no está disponible para tu cuenta.",
        )
    return user
