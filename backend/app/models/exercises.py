from datetime import date, datetime
from sqlalchemy import Date, DateTime, String, Text, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

class DailyExercise(Base):
    __tablename__ = "daily_exercises"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    fecha: Mapped[date] = mapped_column(Date, unique=True, index=True, nullable=False)
    course_session_id: Mapped[int | None] = mapped_column(ForeignKey("course_sessions.id", ondelete="SET NULL"), nullable=True)
    numero: Mapped[int] = mapped_column(nullable=False, server_default="1")
    enunciado: Mapped[str] = mapped_column(Text, nullable=False)
    imagen_path: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    course_session: Mapped["CourseSession"] = relationship()
