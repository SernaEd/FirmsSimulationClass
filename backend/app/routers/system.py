"""Endpoints de Dominio 4 accesibles a integrantes activos: lectura de
feature flags para decidir qué mostrar en la UI (ej. ocultar "Décimas"
fuera de las últimas semanas del semestre). Espejo de admin_system.py, pero
de solo lectura y sin exponer metadatos de auditoría."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_active_user
from app.models.user import User
from app.schemas.system import FlagStatusOut
from app.services.system_config import get_flag

router = APIRouter(prefix="/system", tags=["system"])


@router.get("/flags/{key}", response_model=FlagStatusOut)
def get_flag_status(
    key: str,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_active_user),
) -> FlagStatusOut:
    return FlagStatusOut(key=key, enabled=get_flag(db, key))
