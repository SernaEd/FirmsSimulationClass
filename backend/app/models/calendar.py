"""Calendario académico (§11.5, Iteración 1).

Dos tablas: `CalendarEventType` es un catálogo editable desde admin (como
`PrivilegeCatalog`) -- el profesor define categorías ("Examen", "Entrega de
tarea", "Descanso obligatorio", ...) con un color de UI y si esa categoría
cuenta como día neutro para la racha. `CalendarEvent` es la instancia real
en una fecha, con alcance `todos` (visible a todo el curso) o `alumno`
(visible solo a los alumnos listados en `alcance_ids` -- ej. un examen
reprogramado para una persona) -- misma forma `alcance_tipo`/`alcance_ids`
que ya tenía `Announcement` (removido del MVP, ver plan_de_tareas_mvp.md).
Nota honesta: eso no es un patrón ya probado en producción -- `Announcement`
nunca vio tráfico real antes de removerse (por una decisión de alcance sin
relación con esto, no porque el patrón fallara); aquí se reutiliza la forma
porque ya se pensó una vez, no porque haya evidencia de que escala bien.
Sigue siendo razonable a este tamaño de curso (una sola clase, listas
chicas, ver el filtro en Python de `routers/calendar.py`).

Solo un evento `alcance=todos` cuya categoría tenga `afecta_racha=True`
marca el día como neutro para la racha diaria (§5.5) -- un evento personal
(alcance=alumno) es puramente informativo y no toca el motor de racha.
"""

from datetime import date, datetime
from enum import Enum

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Index,
    JSON,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CalendarEventType(Base):
    """Categoría de evento, editable desde admin (nombre + color + si
    cuenta como día neutro para la racha)."""

    __tablename__ = "calendar_event_types"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(60), nullable=False, unique=True)
    # Clave de color fija (no un valor CSS libre) -- el frontend la mapea a
    # clases Tailwind ya existentes en el sistema de diseño (ver
    # UiDesign/README.md). Evita que un admin meta un color fuera de paleta.
    color: Mapped[str] = mapped_column(String(20), nullable=False, default="neutral")
    afecta_racha: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"<CalendarEventType {self.nombre!r}>"


class CalendarEventScope(str, Enum):
    todos = "todos"
    alumno = "alumno"


class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    tipo_id: Mapped[int] = mapped_column(ForeignKey("calendar_event_types.id"), nullable=False, index=True)
    fecha: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    titulo: Mapped[str] = mapped_column(String(120), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)

    alcance_tipo: Mapped[CalendarEventScope] = mapped_column(
        SQLEnum(CalendarEventScope, native_enum=False, length=10),
        nullable=False,
        default=CalendarEventScope.todos,
    )
    # Lista de user_id cuando alcance_tipo=alumno; None cuando alcance_tipo=todos.
    alcance_ids: Mapped[list[int] | None] = mapped_column(JSON, nullable=True)

    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    tipo: Mapped[CalendarEventType] = relationship()

    __table_args__ = (
        Index("ix_calendar_events_fecha_alcance", "fecha", "alcance_tipo"),
    )

    def __repr__(self) -> str:
        return f"<CalendarEvent {self.fecha} {self.titulo!r} ({self.alcance_tipo.value})>"
