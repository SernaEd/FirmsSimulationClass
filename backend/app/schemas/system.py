"""Schemas Pydantic de Dominio 4 (Inbox, Flags/State).

Nota: los schemas de Announcement se removieron junto con la feature —
los anuncios se publican en Brightspace. Ver plan_de_tareas_mvp.md.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.system import InboxItemStatus, InboxItemType, InboxPriority

# ---------------------------------------------------------------------------
# Inbox
# ---------------------------------------------------------------------------


class InboxItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tipo: InboxItemType
    referencia_id: int | None
    payload_json: dict | None
    prioridad: InboxPriority
    estado: InboxItemStatus
    snoozed_until: datetime | None
    created_at: datetime
    resuelto_at: datetime | None
    resuelto_por: int | None
    nota_resolucion: str | None


class ResolveIn(BaseModel):
    nota: str | None = Field(default=None, max_length=500)


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
    description: str | None
    updated_at: datetime
    updated_by: int | None


class SetFlagIn(BaseModel):
    enabled: bool
    description: str | None = Field(default=None, max_length=300)
