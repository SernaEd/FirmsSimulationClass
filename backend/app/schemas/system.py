"""Schemas Pydantic de Dominio 4 (Inbox, Anuncios, Flags/State)."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.system import (
    AnnouncementPriority,
    AnnouncementScope,
    InboxItemStatus,
    InboxItemType,
    InboxPriority,
)

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
# Anuncios
# ---------------------------------------------------------------------------


class AnnouncementIn(BaseModel):
    titulo: str = Field(min_length=1, max_length=100)
    cuerpo_md: str = Field(min_length=1)
    prioridad: AnnouncementPriority = AnnouncementPriority.normal
    anclado: bool = False
    alcance_tipo: AnnouncementScope = AnnouncementScope.todos
    alcance_ids: list[int] | None = None
    expira_at: datetime | None = None


class AnnouncementUpdate(BaseModel):
    """El alcance no es editable tras crear (MVP): evita reconciliar
    confirmaciones de lectura ya hechas contra una audiencia distinta."""

    titulo: str | None = Field(default=None, min_length=1, max_length=100)
    cuerpo_md: str | None = Field(default=None, min_length=1)
    prioridad: AnnouncementPriority | None = None
    anclado: bool | None = None
    expira_at: datetime | None = None


class AnnouncementBaseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    titulo: str
    cuerpo_md: str
    prioridad: AnnouncementPriority
    anclado: bool
    alcance_tipo: AnnouncementScope
    alcance_ids: list[int] | None
    autor_id: int
    publicado_at: datetime
    expira_at: datetime | None
    activo: bool
    created_at: datetime
    updated_at: datetime


class AdminAnnouncementOut(AnnouncementBaseOut):
    read_count: int
    audience_size: int


class StudentAnnouncementOut(AnnouncementBaseOut):
    leido: bool


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
