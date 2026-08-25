"""Modelos de Dominio 3 — economía de Tokens.

Cubre el banco unificado, catálogo de privilegios, tickets con Split Bill
y solicitudes de canje de Tokens por décimas al cierre de semestre.

Convenciones:
- `TokenLedger` es **append-only** (nunca UPDATE ni DELETE). El saldo actual
  de una persona es la suma de sus deltas.
- Los ajustes se hacen creando un movimiento compensatorio.
- `PrivilegeTicket` para privilegios individuales pasa directo a `emitted`;
  para privilegios grupales inicia en `funding` y se emite cuando la suma
  de contribuciones cubre el costo.
- Ver §5, §12.6 y §17.0 del plan v2.
"""

from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class TokenSource(str, Enum):
    """Fuentes de movimiento en el banco unificado (§5.1)."""

    practica = "practica"
    racha = "racha"
    hito_racha = "hito_racha"
    licitacion = "licitacion"
    sustentacion_destacada = "sustentacion_destacada"
    post_destacado = "post_destacado"
    kudos_out = "kudos_out"
    kudos_in = "kudos_in"
    ajuste_admin = "ajuste_admin"
    canje_privilegio = "canje_privilegio"
    canje_decima = "canje_decima"
    split_bill_refund = "split_bill_refund"
    bono_manual = "bono_manual"


class TicketStatus(str, Enum):
    """Estados del ticket de privilegio."""

    funding = "funding"       # split bill en curso, esperando contribuciones
    emitted = "emitted"       # listo para presentar/consumir
    consumed = "consumed"     # profesor lo marcó como usado
    cancelled = "cancelled"   # cancelado; contribuciones reembolsadas
    expired = "expired"       # (reservado) para tickets con caducidad


class DecimalRequestStatus(str, Enum):
    pendiente = "pendiente"
    aprobado = "aprobado"
    rechazado = "rechazado"


# ---------------------------------------------------------------------------
# Catálogo de privilegios
# ---------------------------------------------------------------------------

class PrivilegeCatalog(Base):
    """Entrada del catálogo (§5.2). Configurable desde admin."""

    __tablename__ = "privilege_catalog"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    categoria: Mapped[str | None] = mapped_column(String(50), nullable=True)
    # Ej.: "tarea" | "examen" | "sustentacion" | "asistencia" | "contenido" | "tutoria" | "racha"

    costo: Mapped[int] = mapped_column(Integer, nullable=False)

    # Compras grupales por aportación voluntaria (§Split Bill).
    es_grupal: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Topes editables. Ejemplos:
    #   {"por_tarea": 1, "por_examen": 2, "por_semestre": 3}
    # Se validan al momento de emitir el ticket.
    limites_config: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Toggle simple de visibilidad al alumnado.
    visible: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Feature flag opcional (§5.2 IA en examen). Si está definido, el privilegio
    # solo aparece cuando el flag correspondiente está encendido en `system_flags`.
    feature_flag_key: Mapped[str | None] = mapped_column(String(80), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    tickets: Mapped[list["PrivilegeTicket"]] = relationship(back_populates="catalog")

    def __repr__(self) -> str:
        return f"<PrivilegeCatalog {self.nombre} ({self.costo} Tks)>"


# ---------------------------------------------------------------------------
# Tickets de privilegio
# ---------------------------------------------------------------------------

class PrivilegeTicket(Base):
    """Un ticket con folio único que representa el derecho a usar un privilegio.

    Individual: se crea directamente en `emitted` con una única contribución
    del comprador. Grupal (Split Bill): inicia en `funding` y transita a
    `emitted` cuando la suma de contribuciones cubre `costo_total`.
    """

    __tablename__ = "privilege_tickets"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    folio: Mapped[str] = mapped_column(String(24), nullable=False, unique=True, index=True)

    catalog_id: Mapped[int] = mapped_column(ForeignKey("privilege_catalog.id"), nullable=False)
    initiator_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    # Split bill solo aplica cuando hay equipo; para individuales queda NULL.
    team_id: Mapped[int | None] = mapped_column(ForeignKey("teams.id"), nullable=True)

    costo_total: Mapped[int] = mapped_column(Integer, nullable=False)   # snapshot al crear
    pagado_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    estado: Mapped[TicketStatus] = mapped_column(
        SQLEnum(TicketStatus, native_enum=False, length=20),
        nullable=False,
        default=TicketStatus.funding,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    emitido_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    consumido_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    consumido_por_admin_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    catalog: Mapped[PrivilegeCatalog] = relationship(back_populates="tickets")
    contribuciones: Mapped[list["SplitBillContribution"]] = relationship(
        back_populates="ticket", cascade="all, delete-orphan"
    )
    initiator: Mapped["User"] = relationship(foreign_keys=[initiator_user_id])

    @property
    def initiator_name(self) -> str | None:
        return self.initiator.nickname if getattr(self, "initiator", None) else None

    @property
    def catalog_name(self) -> str | None:
        return self.catalog.nombre if getattr(self, "catalog", None) else None


    __table_args__ = (
        Index("ix_tickets_estado_catalog", "estado", "catalog_id"),
    )


class SplitBillContribution(Base):
    """Aportación individual a un ticket (individual o grupal).

    Para tickets individuales existe una única fila con `amount = costo_total`.
    Para tickets grupales, una fila por cada persona que aportó.
    """

    __tablename__ = "split_bill_contributions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ticket_id: Mapped[int] = mapped_column(
        ForeignKey("privilege_tickets.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)   # Tks positivos
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    refunded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    ticket: Mapped[PrivilegeTicket] = relationship(back_populates="contribuciones")

    __table_args__ = (
        Index("ix_split_contrib_ticket_user", "ticket_id", "user_id"),
    )


# ---------------------------------------------------------------------------
# Ledger (banco unificado)
# ---------------------------------------------------------------------------

class TokenLedger(Base):
    """Movimientos append-only del banco unificado (§12.6).

    Nunca se hace UPDATE ni DELETE — cualquier ajuste se materializa como un
    nuevo renglón con delta compensatorio y `fuente=ajuste_admin`. El saldo
    actual de una persona es la suma de sus deltas.
    """

    __tablename__ = "token_ledger"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    delta: Mapped[int] = mapped_column(Integer, nullable=False)   # con signo
    fuente: Mapped[TokenSource] = mapped_column(
        SQLEnum(TokenSource, native_enum=False, length=30),
        nullable=False,
        index=True,
    )
    # Puntero polimórfico. Ej.: ("ticket", 42), ("kudos", 7), ("licitacion", 3).
    referencia_tipo: Mapped[str | None] = mapped_column(String(30), nullable=True)
    referencia_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)

    nota: Mapped[str | None] = mapped_column(Text, nullable=True)
    admin_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )

    __table_args__ = (
        Index("ix_ledger_user_created", "user_id", "created_at"),
    )


# ---------------------------------------------------------------------------
# Canje de Tokens por décimas al cierre de semestre
# ---------------------------------------------------------------------------

class DecimalRedemptionRequest(Base):
    """Solicitud del alumno para canjear Tokens sobrantes por décimas.

    Solo se puede solicitar cuando el semestre está en estado `canje_abierto`
    (§17.0). El profesor aprueba o rechaza. La conversión (default 50 pts =
    1 décima) es configurable desde `SystemState` (Dominio 4).
    """

    __tablename__ = "decimal_redemption_requests"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    # Por ahora texto libre. En Iteración 3 se agrega FK opcional a Assignment.
    entrega_descripcion: Mapped[str] = mapped_column(String(200), nullable=False)
    entrega_ref: Mapped[str | None] = mapped_column(String(50), nullable=True)

    decimas_solicitadas: Mapped[int] = mapped_column(Integer, nullable=False)   # p. ej. 3 = 0.3 pts
    pts_costo: Mapped[int] = mapped_column(Integer, nullable=False)             # snapshot

    estado: Mapped[DecimalRequestStatus] = mapped_column(
        SQLEnum(DecimalRequestStatus, native_enum=False, length=20),
        nullable=False,
        default=DecimalRequestStatus.pendiente,
        index=True,
    )
    nota_profesor: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    user: Mapped["User"] = relationship(foreign_keys=[user_id])

    @property
    def user_name(self) -> str | None:
        return self.user.nickname if getattr(self, "user", None) else None
