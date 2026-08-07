from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Enum as SQLEnum, ForeignKey, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TeamNameStatus(str, Enum):
    """Estado del nombre del equipo (§6.2, §12.6)."""

    pendiente = "pendiente"           # sin propuesta aprobada ni nombre asignado
    aprobado = "aprobado"             # nombre propuesto por integrantes y aprobado por admin
    asignado_por_sistema = "asignado_por_sistema"  # fallback tras 7 días sin propuesta


class ProposalStatus(str, Enum):
    """Estado de una propuesta de nombre de firma."""

    pendiente_mod = "pendiente_mod"   # esperando moderación del admin
    aprobado = "aprobado"
    rechazado = "rechazado"
    superseded = "superseded"         # otra propuesta más nueva la reemplazó


class Team(Base):
    __tablename__ = "teams"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nombre_firma: Mapped[str | None] = mapped_column(String(40), nullable=True, unique=True)
    estado_nombre: Mapped[TeamNameStatus] = mapped_column(
        SQLEnum(TeamNameStatus, native_enum=False, length=25),
        nullable=False,
        default=TeamNameStatus.pendiente,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    members: Mapped[list["TeamMember"]] = relationship(
        back_populates="team", cascade="all, delete-orphan"
    )
    name_proposals: Mapped[list["TeamNameProposal"]] = relationship(
        back_populates="team", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        name = self.nombre_firma or f"Team #{self.id}"
        return f"<Team {name} ({self.estado_nombre.value})>"


class TeamMember(Base):
    __tablename__ = "team_members"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    left_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    team: Mapped[Team] = relationship(back_populates="members")

    __table_args__ = (
        # Índice compuesto para la consulta "equipos activos de un user".
        Index("ix_team_members_user_active", "user_id", "left_at"),
        Index("ix_team_members_team_active", "team_id", "left_at"),
    )


class TeamNameProposal(Base):
    __tablename__ = "team_name_proposals"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    propuesta: Mapped[str] = mapped_column(String(40), nullable=False)
    propuesto_por: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    estado: Mapped[ProposalStatus] = mapped_column(
        SQLEnum(ProposalStatus, native_enum=False, length=20),
        nullable=False,
        default=ProposalStatus.pendiente_mod,
        index=True,
    )
    nota_moderacion: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    team: Mapped[Team] = relationship(back_populates="name_proposals")
