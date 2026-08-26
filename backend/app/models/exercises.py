from datetime import date, datetime
from sqlalchemy import Date, DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

class DailyExercise(Base):
    __tablename__ = "daily_exercises"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    fecha: Mapped[date] = mapped_column(Date, unique=True, index=True, nullable=False)
    tema: Mapped[str] = mapped_column(String(255), nullable=False, server_default="General")
    numero: Mapped[int] = mapped_column(nullable=False, server_default="1")
    enunciado: Mapped[str] = mapped_column(Text, nullable=False)
    imagen_path: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
