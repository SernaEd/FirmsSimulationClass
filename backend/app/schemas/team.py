from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.team import ProposalStatus, TeamNameStatus

# ---- Validador reutilizable de nombres de firma (§6.2) ----
# 3-40 chars; letras (incluye acentos y ñ), números, espacios y guiones. Sin emojis.
_NAME_ALLOWED_CHARS = set(
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "áéíóúÁÉÍÓÚñÑüÜ"
    "0123456789"
    " -"
)


def validate_firma_name(v: str) -> str:
    v = v.strip()
    if not (3 <= len(v) <= 40):
        raise ValueError("El nombre debe tener entre 3 y 40 caracteres.")
    if any(c not in _NAME_ALLOWED_CHARS for c in v):
        raise ValueError(
            "Solo se permiten letras (con acentos), números, espacios y guiones."
        )
    return v


# ---- Miembros ----
class TeamMemberOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    nombre: str
    apellidos: str
    nickname: str
    perfil: str | None
    joined_at: datetime


# ---- Team ----
class TeamOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre_firma: str | None
    estado_nombre: TeamNameStatus
    created_at: datetime
    members: list[TeamMemberOut]


# ---- Generación de equipos ----
class GenerateTeamsIn(BaseModel):
    tamano_preferido: Literal[3, 4] = 4  # default 4 (§6 mezcla 3 y 4)
    incluir_admin: bool = False           # normalmente el profesor no forma parte

    dry_run: bool = False                 # si True, solo devuelve la propuesta sin crearla


class GenerateTeamsResult(BaseModel):
    total_alumnos_disponibles: int
    equipos_generados: int
    tamanos: list[int]
    teams: list[TeamOut] | None = None
    warnings: list[str] = []


# ---- Propuestas de nombre ----
class ProposeNameIn(BaseModel):
    propuesta: str = Field(min_length=3, max_length=40)

    @field_validator("propuesta")
    @classmethod
    def _validate(cls, v: str) -> str:
        return validate_firma_name(v)


class ProposalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    team_id: int
    propuesta: str
    propuesto_por: int
    estado: ProposalStatus
    nota_moderacion: str | None
    created_at: datetime
    resolved_at: datetime | None
    resolved_by: int | None


class RejectProposalIn(BaseModel):
    nota_moderacion: str | None = Field(default=None, max_length=500)


class AssignDefaultNameIn(BaseModel):
    """Fallback tras 7 días o cuando el admin decide asignar 'Firma A/B/…'."""

    # opcional: si se omite, el sistema calcula "Firma A", "Firma B", ...
    nombre: str | None = None

    @field_validator("nombre")
    @classmethod
    def _validate(cls, v: str | None) -> str | None:
        if v is None:
            return None
        return validate_firma_name(v)


class RenameTeamIn(BaseModel):
    """Cambio de nombre a criterio del admin. Deja estado `aprobado`."""

    nombre: str = Field(min_length=3, max_length=40)

    @field_validator("nombre")
    @classmethod
    def _validate(cls, v: str) -> str:
        return validate_firma_name(v)
