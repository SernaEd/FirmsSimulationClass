"""Modelos de la Racha Diaria (Iteración 1) — evidencia de WebAssign.

La plataforma ya no resuelve ejercicios propios: los alumnos resuelven en
WebAssign y suben el link al reporte + una captura como evidencia del día.
No hay cola de revisión — subir evidencia marca el día `completado` de
inmediato; el profesor hace verificación puntual (spot-check) ante disputas
o sospecha de evidencia falsa (§18.4). Ver §5.5, §12.6 del plan v2.

`StreakDay` no aparece en el checklist de "Modelos y migraciones nuevas" de
plan_de_tareas_mvp.md (ese ítem solo lista `StreakEvidence`), pero
`StreakEvidence.streak_day_id` necesita una tabla real para ser un FK
válido, así que se agrega aquí como la mínima pieza de soporte. El esbozo
original (§12.6) describe una referencia en ambos sentidos
(`StreakDay.evidencia_id` y `StreakEvidence.streak_day_id`); para evitar un
FK circular se deja una sola columna física (`StreakEvidence.streak_day_id`,
única) y se llega al otro sentido vía `relationship`
(`StreakDay.evidence`).
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
    """Evidencia subida por el alumno para un `StreakDay` (§5.5).

    Link al reporte de WebAssign + captura de pantalla. Subir evidencia
    marca el día `completado` de inmediato (sin cola de revisión); queda
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
    webassign_report_url: Mapped[str] = mapped_column(String(500), nullable=False)
    captura_path: Mapped[str] = mapped_column(String(255), nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    streak_day: Mapped[StreakDay] = relationship(back_populates="evidence")

    def __repr__(self) -> str:
        return f"<StreakEvidence day={self.streak_day_id} user={self.user_id}>"
