"""Endpoints admin sobre usuarios (Dominio 1). El manejo de la cola de
aprobación completo (Inbox) llega en el Dominio 4."""

import secrets
import string

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_admin
from app.models.user import User, UserStatus
from app.schemas.auth import UserOut
from app.security import hash_pin

router = APIRouter(prefix="/admin/users", tags=["admin:users"])


def _generate_temp_pin(length: int = 8) -> str:
    alphabet = string.digits + string.ascii_letters
    return "".join(secrets.choice(alphabet) for _ in range(length))


@router.post("/{user_id}/reset-pin")
def reset_pin(
    user_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no existe.")

    temp_pin = _generate_temp_pin()
    user.pin_hash = hash_pin(temp_pin)
    db.commit()

    return {
        "user_id": user.id,
        "temp_pin": temp_pin,
        "message": (
            "PIN reseteado. Entrega este PIN temporal al alumno de forma segura. "
            "Al iniciar sesión debe cambiarlo (feature de cambio de PIN pendiente en próxima iteración)."
        ),
    }


@router.post("/{user_id}/approve", response_model=UserOut)
def approve(
    user_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no existe.")
    if user.estado not in (UserStatus.pending_approval, UserStatus.pending_profile):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cuenta en estado '{user.estado.value}', no puede aprobarse.",
        )
    user.estado = UserStatus.active
    db.commit()
    db.refresh(user)
    return user


@router.post("/{user_id}/reject", response_model=UserOut)
def reject(
    user_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no existe.")
    user.estado = UserStatus.rejected
    db.commit()
    db.refresh(user)
    return user


@router.get("/pending", response_model=list[UserOut])
def list_pending(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[User]:
    """Vista provisional hasta que llegue el Inbox de Aprobaciones (Dominio 4)."""
    return (
        db.query(User)
        .filter(User.estado.in_([UserStatus.pending_approval, UserStatus.pending_profile]))
        .order_by(User.created_at.asc())
        .all()
    )


@router.get("", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[User]:
    """Lista todos los usuarios activos para dropdowns administrativos."""
    return (
        db.query(User)
        .filter(User.estado == UserStatus.active)
        .order_by(User.nombre.asc())
        .all()
    )
