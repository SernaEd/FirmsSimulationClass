"""Calendario académico editable (§11.5, Iteración 1).

Cubre únicamente lo que la racha diaria necesita: marcar un día como
festivo/sin clase para que cuente como `neutro` en vez de penalizar a los
alumnos. Lunes-jueves cuentan para la racha por diseño (§5.5); viernes-
domingo ya son neutros sin necesidad de marcarlos aquí (ver
`app/services/streak.py::is_racha_day`). Esta tabla cubre solo las
excepciones dentro de una semana de clase (ej. un lunes festivo).
"""

from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AcademicCalendarDay(Base):
    __tablename__ = "academic_calendar_days"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    fecha: Mapped[date] = mapped_column(Date, unique=True, nullable=False, index=True)
    motivo: Mapped[str] = mapped_column(String(200), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    def __repr__(self) -> str:
        return f"<AcademicCalendarDay {self.fecha} ({self.motivo!r})>"
