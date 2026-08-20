"""Endpoints admin de configuración global: feature flags (§5.2, §11.4)."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_admin
from app.models.user import User
from app.schemas.system import KnownFlagOut, SetFlagIn, SystemFlagOut
from app.services.system_config import list_flags, list_known_flag_keys, set_flag

router = APIRouter(prefix="/admin/system", tags=["admin:system"])


def _to_out(flag) -> SystemFlagOut:
    enabled = bool(flag.value.get("enabled", False)) if isinstance(flag.value, dict) else bool(flag.value)
    return SystemFlagOut(
        key=flag.key,
        enabled=enabled,
        description=flag.description,
        updated_at=flag.updated_at,
        updated_by=flag.updated_by,
    )


@router.get("/flags", response_model=list[SystemFlagOut])
def get_flags(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    return [_to_out(f) for f in list_flags(db)]


@router.get("/flags/known-keys", response_model=list[KnownFlagOut])
def get_known_flag_keys(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Claves referenciadas por el catálogo (ej. `ai_in_exam_enabled`) o por
    el registro estático de flags fuera del catálogo (ej. `decimas_enabled`)
    que todavía no tienen fila en `system_flags` -- aparecen como 'apagadas'
    por default hasta que el admin las active por primera vez."""
    return list_known_flag_keys(db)


@router.put("/flags/{key}", response_model=SystemFlagOut)
def upsert_flag(
    key: str,
    payload: SetFlagIn,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    flag = set_flag(db, key, payload.enabled, admin, description=payload.description)
    return _to_out(flag)
