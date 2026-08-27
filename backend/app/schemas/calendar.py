from datetime import date, datetime
from typing import List, Literal, Optional, TypeAlias

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.calendar import CalendarEventScope

# Paleta fija -- el frontend mapea cada clave a clases Tailwind ya definidas
# en el sistema de diseño (ver UiDesign/README.md). No es texto libre: un
# admin no puede meter un color fuera de la paleta del sistema.
#
# Optional[X]/List[X] en vez de `X | None`/`list[X]` en todo este archivo:
# el linter Community de Qodana dispara falsos positivos confirmados sobre
# la sintaxis moderna (mismo caso ya resuelto así en schemas/content.py y
# services/content.py -- ver backend/qodana.yaml). `TypeAlias` explícito en
# la línea de abajo por la misma razón: sin la anotación, Qodana no
# reconoce la asignación como un alias de tipo válido.
CalendarEventColor: TypeAlias = Literal["neutral", "accent", "accent2", "red", "amber", "emerald"]


class CalendarEventTypeCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=60)
    color: CalendarEventColor = "neutral"
    afecta_racha: bool = False


class CalendarEventTypeUpdate(BaseModel):
    nombre: Optional[str] = Field(default=None, min_length=1, max_length=60)
    color: Optional[CalendarEventColor] = None
    afecta_racha: Optional[bool] = None


class CalendarEventTypeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    color: str
    afecta_racha: bool
    created_at: datetime


def normalize_alcance(alcance_tipo: CalendarEventScope, alcance_ids: Optional[List[int]]) -> Optional[List[int]]:
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
    descripcion: Optional[str] = None
    alcance_tipo: CalendarEventScope = CalendarEventScope.todos
    alcance_ids: Optional[List[int]] = None

    @model_validator(mode="after")
    def _check_alcance(self) -> "CalendarEventCreate":
        self.alcance_ids = normalize_alcance(self.alcance_tipo, self.alcance_ids)
        return self


class CalendarEventUpdate(BaseModel):
    tipo_id: Optional[int] = None
    fecha: Optional[date] = None
    titulo: Optional[str] = Field(default=None, min_length=1, max_length=120)
    descripcion: Optional[str] = None
    alcance_tipo: Optional[CalendarEventScope] = None
    alcance_ids: Optional[List[int]] = None


class CalendarEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tipo_id: int
    tipo: CalendarEventTypeOut
    fecha: date
    titulo: str
    descripcion: Optional[str]
    alcance_tipo: CalendarEventScope
    alcance_ids: Optional[List[int]]
    created_at: datetime
