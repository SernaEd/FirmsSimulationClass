"""Modelos de la Racha Diaria (Iteración 1) — evidencia y banco de ejercicios.

El alumno puede enviar la solución de un ejercicio del banco de ejercicios diario
en formato de imagen o PDF. El administrador puede verificar estas soluciones
mediante spot-checks y cambiar el estado del día si la solución es incorrecta.
"""

from datetime import date, datetime
from enum import Enum

from sqlalchemy import Date, DateTime, Enum as SQLEnum, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class StreakDayStatus(str, Enum):
    """Estado de un día de racha para un alumno (§12.6)."""

    completado = "completado"
    fallido = "fallido"
    neutro = "neutro"                 # día sin clase / festivo — no cuenta ni rompe racha
    pase_aplicado = "pase_aplicado"   # cubierto con un pase de racha del inventario
    pendiente_revision = "pendiente_revision" # Falta de evidencia pendiente de revisión por admin


class StreakDay(Base):
    __tablename__ = "streak_days"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    fecha: Mapped[date] = mapped_column(Date, nullable=False)
    estado: Mapped[StreakDayStatus] = mapped_column(
        SQLEnum(StreakDayStatus, native_enum=False, length=20),
        nullable=False,
    )

    evidence: Mapped["StreakEvidence | None"] = relationship(
        back_populates="streak_day", uselist=False
    )

    __table_args__ = (
        UniqueConstraint("user_id", "fecha", name="uq_streak_day_user_fecha"),
    )

    def __repr__(self) -> str:
        return f"<StreakDay user={self.user_id} {self.fecha} ({self.estado.value})>"


class StreakEvidence(Base):
    """Evidencia subida por el alumno para un `StreakDay`.

    Captura de pantalla o PDF de la solución al ejercicio del día.
    Subir evidencia marca el día `completado` de inmediato; queda
    disponible para verificación puntual del profesor.
    """

    __tablename__ = "streak_evidence"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    streak_day_id: Mapped[int] = mapped_column(
        ForeignKey("streak_days.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    
    daily_exercise_id: Mapped[int | None] = mapped_column(ForeignKey("daily_exercises.id"), nullable=True)
    solucion_path: Mapped[str] = mapped_column(String(255), nullable=False)
    
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    streak_day: Mapped[StreakDay] = relationship(back_populates="evidence")
    user: Mapped["User"] = relationship()

    def __repr__(self) -> str:
        return f"<StreakEvidence day={self.streak_day_id} user={self.user_id}>"
