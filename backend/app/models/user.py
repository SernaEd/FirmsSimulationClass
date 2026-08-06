from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, DateTime, Enum as SQLEnum, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class UserStatus(str, Enum):
    """Estados del ciclo de vida de la cuenta (§2)."""

    pending_profile = "pending_profile"
    pending_approval = "pending_approval"
    active = "active"
    rejected = "rejected"


class UserProfile(str, Enum):
    """Perfiles de trabajo en equipo (§3.2). Nullable hasta completar el test."""

    analista = "analista"
    modelador = "modelador"
    integrador = "integrador"


class UserPronouns(str, Enum):
    """Pronombres declarados por la persona usuaria.

    Se usan para personalizar mensajes clave del UI (saludos, bienvenidas).
    El default 'prefiero_no_decir' fuerza fraseo neutral. Ver
    memoria feedback-lenguaje-incluyente."""

    ella = "ella"
    el = "el"
    elle = "elle"
    prefiero_no_decir = "prefiero_no_decir"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    apellidos: Mapped[str] = mapped_column(String(100), nullable=False)
    numero_cuenta: Mapped[str] = mapped_column(String(20), nullable=False, unique=True, index=True)
    nickname: Mapped[str] = mapped_column(String(40), nullable=False, unique=True, index=True)
    pin_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    correo_institucional: Mapped[str | None] = mapped_column(String(255), nullable=True)

    estado: Mapped[UserStatus] = mapped_column(
        SQLEnum(UserStatus, native_enum=False, length=20),
        nullable=False,
        default=UserStatus.pending_approval,
        index=True,
    )
    perfil: Mapped[UserProfile | None] = mapped_column(
        SQLEnum(UserProfile, native_enum=False, length=20),
        nullable=True,
    )
    pronombres: Mapped[UserPronouns] = mapped_column(
        SQLEnum(UserPronouns, native_enum=False, length=20),
        nullable=False,
        default=UserPronouns.prefiero_no_decir,
    )

    is_admin: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    terms_accepted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"<User {self.numero_cuenta} ({self.estado.value})>"
