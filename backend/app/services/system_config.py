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


def list_known_flag_keys(db: Session) -> list[dict]:
    """Todas las claves de flag que el código hoy puede consultar y aún no
    tienen fila en `system_flags`: las `feature_flag_key` referenciadas por
    el catálogo de privilegios (§5.2, autodescubiertas — sin descripción
    propia aquí, el catálogo ya las explica) + un registro estático de
    flags que gatean secciones completas de la app fuera del catálogo (ej.
    `decimas_enabled`, §5.4), con su descripción. Así el admin ve todo lo
    disponible en vez de tener que memorizar el nombre exacto de un flag
    para crearlo."""
    from app.models.economy import PrivilegeCatalog
    from app.services.tokens import DECIMAS_FLAG_KEY  # import perezoso: evita ciclo

    static_flags: dict[str, str] = {
        DECIMAS_FLAG_KEY: (
            "Habilita el menú de Canje de Décimas para el alumnado — se "
            "enciende manualmente en las últimas semanas del semestre (§5.4)."
        ),
    }

    referenced = set(
        db.scalars(
            select(PrivilegeCatalog.feature_flag_key).where(
                PrivilegeCatalog.feature_flag_key.isnot(None)
            )
        ).all()
    )
    candidates: dict[str, str | None] = {k: None for k in referenced}
    candidates.update(static_flags)

    existing = set(db.scalars(select(SystemFlag.key)).all())
    return [
        {"key": key, "description": description}
        for key, description in sorted(candidates.items())
        if key not in existing
    ]


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
        # Se sobreescribe siempre (incluido None) — el único caller (PUT
        # /admin/system/flags/{key}) siempre manda la intención completa del
        # admin, nunca "deja lo que había"; un `None` explícito es "limpiar
        # la descripción", no "no me importa".
        flag.value = {"enabled": enabled}
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
