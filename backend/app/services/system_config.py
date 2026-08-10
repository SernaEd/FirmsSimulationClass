"""Lectura/escritura de configuración global (SystemFlag, SystemState).

Ambas tablas son clave-valor mutables (a diferencia del ledger, que es
append-only). El valor se guarda como JSON para admitir tanto booleanos
simples (`{"enabled": true}`) como estructuras más ricas si hiciera falta.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.system import SystemFlag, SystemState
from app.models.user import User


# ---------------------------------------------------------------------------
# Feature flags
# ---------------------------------------------------------------------------

def get_flag(db: Session, key: str) -> bool:
    """Devuelve True solo si el flag existe y su value es truthy.
    Ausencia de flag = desactivado (safe default, §5.2)."""
    flag = db.get(SystemFlag, key)
    if flag is None:
        return False
    if isinstance(flag.value, dict):
        return bool(flag.value.get("enabled", False))
    return bool(flag.value)


def list_flags(db: Session) -> list[SystemFlag]:
    return list(db.scalars(select(SystemFlag).order_by(SystemFlag.key)).all())


def list_known_flag_keys(db: Session) -> list[str]:
    """Claves `feature_flag_key` referenciadas por el catálogo de privilegios
    que aún no tienen una fila en `system_flags` (para que el admin las vea
    sin tener que adivinar el nombre exacto antes de activarlas)."""
    from app.models.economy import PrivilegeCatalog

    referenced = set(
        db.scalars(
            select(PrivilegeCatalog.feature_flag_key).where(
                PrivilegeCatalog.feature_flag_key.isnot(None)
            )
        ).all()
    )
    existing = set(db.scalars(select(SystemFlag.key)).all())
    return sorted(referenced - existing)


def set_flag(
    db: Session,
    key: str,
    enabled: bool,
    admin: User,
    description: str | None = None,
) -> SystemFlag:
    flag = db.get(SystemFlag, key)
    if flag is None:
        flag = SystemFlag(key=key, value={"enabled": enabled}, description=description)
        db.add(flag)
    else:
        flag.value = {"enabled": enabled}
        if description is not None:
            flag.description = description
    flag.updated_by = admin.id
    flag.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(flag)
    return flag


# ---------------------------------------------------------------------------
# Estado global
# ---------------------------------------------------------------------------

def get_state(db: Session, key: str, default=None):
    state = db.get(SystemState, key)
    if state is None:
        return default
    return state.value


def list_state(db: Session) -> list[SystemState]:
    return list(db.scalars(select(SystemState).order_by(SystemState.key)).all())


def set_state(db: Session, key: str, value) -> SystemState:
    state = db.get(SystemState, key)
    if state is None:
        state = SystemState(key=key, value=value)
        db.add(state)
    else:
        state.value = value
        state.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(state)
    return state
