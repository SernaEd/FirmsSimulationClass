"""Endpoints admin sobre usuarios (Dominio 1). Aprobar/rechazar aquí también
resuelve el item correspondiente del Inbox de Aprobaciones (Dominio 4), para
que quede sincronizado sin importar si el profesor actuó desde esta vista
directa o desde /admin/inbox."""

import secrets
import string

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_admin
from app.models.system import InboxItemType
from app.models.user import User, UserStatus
from app.schemas.auth import (
    ReassignProfileIn,
    RenameUserIn,
    SetTeamIn,
    StudentAdminOut,
    UserOut,
)
from app.security import hash_pin
from app.services.inbox import resolve_inbox_items
from app.services.teams import get_active_teams_for_users, set_user_team
from app.services.tokens import get_balance, get_balances

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


@router.post("/{user_id}/reassign-profile", response_model=UserOut)
def reassign_profile(
    user_id: int,
    payload: ReassignProfileIn,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no existe.")
    user.perfil = payload.perfil
    db.commit()
    db.refresh(user)
    return user


@router.post("/{user_id}/rename", response_model=UserOut)
def rename_user(
    user_id: int,
    payload: RenameUserIn,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no existe.")
    user.nombre = payload.nombre.strip()
    user.apellidos = payload.apellidos.strip()
    db.commit()
    db.refresh(user)
    return user


@router.post("/{user_id}/team", response_model=StudentAdminOut)
def set_team(
    user_id: int,
    payload: SetTeamIn,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> StudentAdminOut:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no existe.")
    team = set_user_team(db, user_id, payload.team_id)
    db.commit()
    db.refresh(user)
    return StudentAdminOut(
        **UserOut.model_validate(user).model_dump(),
        team_id=team.id if team else None,
        team_nombre=team.nombre_firma if team else None,
        balance=get_balance(db, user_id),
    )


@router.post("/{user_id}/approve", response_model=UserOut)
def approve(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
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
    resolve_inbox_items(db, InboxItemType.registro, user_id, admin_id=admin.id)
    db.commit()
    db.refresh(user)
    return user


@router.post("/{user_id}/reject", response_model=UserOut)
def reject(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> User:
    """Sin guarda de estado a propósito: se usa tanto para rechazar un
    registro pendiente como para desactivar una cuenta ya activa (ej. un
    alumno que dio de baja la materia) — ambos casos terminan en
    `estado=rejected`, la única forma que hoy tiene el modelo de revocar
    acceso."""
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no existe.")
    user.estado = UserStatus.rejected
    resolve_inbox_items(db, InboxItemType.registro, user_id, admin_id=admin.id)
    db.commit()
    db.refresh(user)
    return user


@router.get("/pending", response_model=list[UserOut])
def list_pending(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[User]:
    """Vista específica de Dominio 1. El Inbox unificado (GET /admin/inbox,
    Dominio 4) muestra lo mismo junto con las demás categorías."""
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


@router.get("/all", response_model=list[StudentAdminOut])
def list_all_students(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[StudentAdminOut]:
    """Vista de Admin · Alumnos: todas las cuentas de alumnado (cualquier
    estado, `is_admin=False`), enriquecida con equipo activo y saldo de
    Tokens. A diferencia de GET /admin/users (solo activas, pensada para
    poblar selects), esta es la fuente de la tabla administrable completa.
    """
    students = (
        db.query(User)
        .filter(User.is_admin.is_(False))
        .order_by(User.apellidos.asc(), User.nombre.asc())
        .all()
    )
    if not students:
        return []

    user_ids = [u.id for u in students]
    team_by_user = get_active_teams_for_users(db, user_ids)
    balance_by_user = get_balances(db, user_ids)

    result: list[StudentAdminOut] = []
    for u in students:
        team = team_by_user.get(u.id)
        result.append(
            StudentAdminOut(
                **UserOut.model_validate(u).model_dump(),
                team_id=team.id if team else None,
                team_nombre=team.nombre_firma if team else None,
                balance=balance_by_user.get(u.id, 0),
            )
        )
    return result
