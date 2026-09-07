"""Schemas Pydantic de Dominio 4 (Inbox, Flags/State).

Nota: los schemas de Announcement se removieron junto con la feature —
los anuncios se publican en Brightspace. Ver plan_de_tareas_mvp.md.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.system import InboxItemStatus, InboxItemType, InboxPriority

# ---------------------------------------------------------------------------
# Inbox
# ---------------------------------------------------------------------------


class InboxItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tipo: InboxItemType
    referencia_id: Optional[int]
    payload_json: Optional[dict]
    prioridad: InboxPriority
    estado: InboxItemStatus
    snoozed_until: Optional[datetime]
    created_at: datetime
    resuelto_at: Optional[datetime]
    resuelto_por: Optional[int]
    nota_resolucion: Optional[str]


class ResolveIn(BaseModel):
    nota: Optional[str] = Field(default=None, max_length=500)


class SnoozeIn(BaseModel):
    until: datetime


class DismissIn(BaseModel):
    nota: str = Field(min_length=1, max_length=500)


# ---------------------------------------------------------------------------
# Feature flags / estado global
# ---------------------------------------------------------------------------


class SystemFlagOut(BaseModel):
    key: str
    enabled: bool
    description: Optional[str]
    updated_at: datetime
    updated_by: Optional[int]


class SetFlagIn(BaseModel):
    enabled: bool
    description: Optional[str] = Field(default=None, max_length=300)


class FlagStatusOut(BaseModel):
    """Versión mínima de un flag para consumo del alumnado (sin metadatos
    de auditoría como `updated_by`) — usada para mostrar/ocultar UI."""

    key: str
    enabled: bool


class KnownFlagOut(BaseModel):
    """Un flag que el código puede consultar pero aún no tiene fila en
    `system_flags` — con descripción cuando viene del registro estático
    (ver `list_known_flag_keys`), para que el admin no tenga que adivinar
    qué hace antes de crearlo."""

    key: str
    description: Optional[str]
