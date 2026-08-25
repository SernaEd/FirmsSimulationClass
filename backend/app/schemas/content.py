from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# ---- Adjuntos ----
class AttachmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    content_type: str
    size_bytes: int
    preview_available: bool
    created_at: datetime


# ---- Sesiones ----
class CourseSessionListOut(BaseModel):
    """Versión ligera para el índice de un módulo — sin descripción/adjuntos."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    numero_sesion: int
    titulo: str


class CourseSessionDetailOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    module_id: int
    numero_sesion: int
    titulo: str
    descripcion: str | None
    embed_url: str | None
    attachments: list[AttachmentOut]


class CourseSessionIn(BaseModel):
    numero_sesion: int = Field(ge=1)
    titulo: str = Field(min_length=1, max_length=200)
    descripcion: str | None = Field(default=None, max_length=10_000)
    embed_url: str | None = Field(default=None, max_length=500)


class CourseSessionUpdate(BaseModel):
    numero_sesion: int | None = Field(default=None, ge=1)
    titulo: str | None = Field(default=None, min_length=1, max_length=200)
    descripcion: str | None = Field(default=None, max_length=10_000)
    embed_url: str | None = Field(default=None, max_length=500)


# ---- Módulos ----
class ModuleIn(BaseModel):
    numero: int = Field(ge=1)
    nombre: str = Field(min_length=1, max_length=120)


class ModuleUpdate(BaseModel):
    numero: int | None = Field(default=None, ge=1)
    nombre: str | None = Field(default=None, min_length=1, max_length=120)


class ModuleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    numero: int
    nombre: str
    unlocked_at: datetime | None
    sessions: list[CourseSessionListOut]
