from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.calendar import CalendarEventScope

# Paleta fija -- el frontend mapea cada clave a clases Tailwind ya definidas
# en el sistema de diseño (ver UiDesign/README.md). No es texto libre: un
# admin no puede meter un color fuera de la paleta del sistema.
CalendarEventColor = Literal["neutral", "accent", "accent2", "red", "amber", "emerald"]


class CalendarEventTypeCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=60)
    color: CalendarEventColor = "neutral"
    afecta_racha: bool = False


class CalendarEventTypeUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=1, max_length=60)
    color: CalendarEventColor | None = None
    afecta_racha: bool | None = None


class CalendarEventTypeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    color: str
    afecta_racha: bool
    created_at: datetime


def normalize_alcance(alcance_tipo: CalendarEventScope, alcance_ids: list[int] | None) -> list[int] | None:
    """Regla única de alcance, compartida entre el validador de creación de
    abajo y `routers/admin_calendar.py::update_event` (que la aplica a mano
    porque un PATCH parcial puede traer solo uno de los dos campos). `alumno`
    exige al menos un id; `todos` siempre limpia la lista -- nunca se guardan
    ids huérfanos de un alcance individual anterior."""
    if alcance_tipo == CalendarEventScope.alumno:
        if not alcance_ids:
            raise ValueError("Selecciona al menos un alumno para un evento con alcance individual.")
        return alcance_ids
    return None


class CalendarEventCreate(BaseModel):
    tipo_id: int
    fecha: date
    titulo: str = Field(min_length=1, max_length=120)
    descripcion: str | None = None
    alcance_tipo: CalendarEventScope = CalendarEventScope.todos
    alcance_ids: list[int] | None = None

    @model_validator(mode="after")
    def _check_alcance(self) -> "CalendarEventCreate":
        self.alcance_ids = normalize_alcance(self.alcance_tipo, self.alcance_ids)
        return self


class CalendarEventUpdate(BaseModel):
    tipo_id: int | None = None
    fecha: date | None = None
    titulo: str | None = Field(default=None, min_length=1, max_length=120)
    descripcion: str | None = None
    alcance_tipo: CalendarEventScope | None = None
    alcance_ids: list[int] | None = None


class CalendarEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tipo_id: int
    tipo: CalendarEventTypeOut
    fecha: date
    titulo: str
    descripcion: str | None
    alcance_tipo: CalendarEventScope
    alcance_ids: list[int] | None
    created_at: datetime
