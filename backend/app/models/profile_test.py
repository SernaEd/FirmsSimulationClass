"""Modelos del test de perfil de trabajo en equipo (§3, Belbin adaptado).

Cada pregunta es un escenario con tres opciones fijas, una por perfil
(`UserProfile`: analista/modelador/integrador). El contenido de las
preguntas se siembra directamente en la migración (contenido fijo, no
editable desde un panel admin — a diferencia del catálogo de privilegios).
"""

from datetime import datetime

from sqlalchemy import DateTime, Enum as SQLEnum, ForeignKey, Integer, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.user import UserProfile


class ProfileTestQuestion(Base):
    __tablename__ = "profile_test_questions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    orden: Mapped[int] = mapped_column(Integer, nullable=False, unique=True)
    enunciado: Mapped[str] = mapped_column(Text, nullable=False)
    opcion_analista: Mapped[str] = mapped_column(Text, nullable=False)
    opcion_modelador: Mapped[str] = mapped_column(Text, nullable=False)
    opcion_integrador: Mapped[str] = mapped_column(Text, nullable=False)

    def __repr__(self) -> str:
        return f"<ProfileTestQuestion #{self.orden}>"


class ProfileTestAnswer(Base):
    __tablename__ = "profile_test_answers"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    question_id: Mapped[int] = mapped_column(
        ForeignKey("profile_test_questions.id", ondelete="CASCADE"), nullable=False
    )
    perfil_elegido: Mapped[UserProfile] = mapped_column(
        SQLEnum(UserProfile, native_enum=False, length=20), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    __table_args__ = (
        UniqueConstraint("user_id", "question_id", name="uq_profile_test_answer_user_question"),
    )
