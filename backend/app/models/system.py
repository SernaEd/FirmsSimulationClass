"""Modelos de Dominio 4 — Sistema (Inbox, Announcements, Flags/State).

Cubre el Inbox de Aprobaciones (§11.0), el publicador de anuncios (§11.3.1)
y la configuración global del curso (feature flags + estado del semestre).

Convenciones:
- `InboxItem` es la bandeja unificada: cada evento del sistema que requiere
  revisión manual crea o actualiza un renglón aquí. El MVP solo genera items
  de tipo `registro` y `nombre_firma`; el resto del enum queda listo para
  cuando existan esas features (retroalimentación, disputas, etc.).
- `SystemFlag`/`SystemState` son pares clave-valor mutables (a diferencia del
  ledger, que es append-only). Cada cambio debería auditarse cuando exista
  `AuditLog` (Iteración 4).
- Ver §11.0, §11.3.1, §12.6 del plan v2.
"""

from datetime import datetime
from enum import Enum

from sqlalchemy import (
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


# ---------------------------------------------------------------------------
# Inbox de Aprobaciones
# ---------------------------------------------------------------------------

class InboxItemType(str, Enum):
    """Categorías del Inbox (§11.0). El MVP solo crea `registro` y
    `nombre_firma`; el resto se activa en iteraciones posteriores conforme
    existan esas features."""

    registro = "registro"
    nombre_firma = "nombre_firma"
    canje_decima = "canje_decima"
    disputa = "disputa"
    sancion = "sancion"
    feedback_sospechoso = "feedback_sospechoso"
    sustentacion_destacada_pendiente = "sustentacion_destacada_pendiente"
    post_destacado_pendiente = "post_destacado_pendiente"
    alerta_inactividad = "alerta_inactividad"
    alerta_sistema = "alerta_sistema"


class InboxPriority(str, Enum):
    alta = "alta"
    media = "media"
    baja = "baja"


class InboxItemStatus(str, Enum):
    pendiente = "pendiente"
    atendido = "atendido"
    pospuesto = "pospuesto"
    descartado = "descartado"
    visto = "visto"


class InboxItem(Base):
    __tablename__ = "inbox_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    tipo: Mapped[InboxItemType] = mapped_column(
        SQLEnum(InboxItemType, native_enum=False, length=40),
        nullable=False,
        index=True,
    )
    # Apunta a la fila de la tabla origen (users.id para 'registro',
    # team_name_proposals.id para 'nombre_firma', etc.). Nullable para
    # alertas de sistema sin entidad asociada.
    referencia_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Datos capturados al crear el item, para render sin hacer joins
    # adicionales (ej. nickname y numero_cuenta de quien se registró).
    payload_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    prioridad: Mapped[InboxPriority] = mapped_column(
        SQLEnum(InboxPriority, native_enum=False, length=10),
        nullable=False,
        default=InboxPriority.media,
    )
    estado: Mapped[InboxItemStatus] = mapped_column(
        SQLEnum(InboxItemStatus, native_enum=False, length=15),
        nullable=False,
        default=InboxItemStatus.pendiente,
        index=True,
    )
    snoozed_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    resuelto_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    resuelto_por: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    nota_resolucion: Mapped[str | None] = mapped_column(Text, nullable=True)

    __table_args__ = (
        Index("ix_inbox_estado_prioridad", "estado", "prioridad"),
        Index("ix_inbox_tipo_referencia", "tipo", "referencia_id"),
    )

    def __repr__(self) -> str:
        return f"<InboxItem {self.tipo.value}#{self.referencia_id} ({self.estado.value})>"


# ---------------------------------------------------------------------------
# Anuncios
# ---------------------------------------------------------------------------

class AnnouncementPriority(str, Enum):
    normal = "normal"
    alta = "alta"


class AnnouncementScope(str, Enum):
    """A quién llega el anuncio. `alcance_ids` se interpreta según el tipo:
    None para `todos`, lista de team_id para `equipo`, lista de user_id
    para `alumno`."""

    todos = "todos"
    equipo = "equipo"
    alumno = "alumno"


class Announcement(Base):
    __tablename__ = "announcements"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    titulo: Mapped[str] = mapped_column(String(100), nullable=False)
    cuerpo_md: Mapped[str] = mapped_column(Text, nullable=False)

    prioridad: Mapped[AnnouncementPriority] = mapped_column(
        SQLEnum(AnnouncementPriority, native_enum=False, length=10),
        nullable=False,
        default=AnnouncementPriority.normal,
    )
    anclado: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    alcance_tipo: Mapped[AnnouncementScope] = mapped_column(
        SQLEnum(AnnouncementScope, native_enum=False, length=10),
        nullable=False,
        default=AnnouncementScope.todos,
    )
    # Lista de team_id o user_id según alcance_tipo. None cuando alcance_tipo=todos.
    alcance_ids: Mapped[list[int] | None] = mapped_column(JSON, nullable=True)

    autor_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    publicado_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    expira_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Soft-delete: el histórico admin conserva el registro.
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    reads: Mapped[list["AnnouncementRead"]] = relationship(
        back_populates="announcement", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_announcements_activo_anclado", "activo", "anclado"),
    )


class AnnouncementRead(Base):
    __tablename__ = "announcement_reads"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    announcement_id: Mapped[int] = mapped_column(
        ForeignKey("announcements.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    read_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    announcement: Mapped[Announcement] = relationship(back_populates="reads")

    __table_args__ = (
        Index("ix_announcement_reads_unique", "announcement_id", "user_id", unique=True),
    )


# ---------------------------------------------------------------------------
# Configuración global (Flags y Estado)
# ---------------------------------------------------------------------------

class SystemFlag(Base):
    """Feature flags booleanos/JSON. Ej. `ai_in_exam_enabled` (§5.2)."""

    __tablename__ = "system_flags"

    key: Mapped[str] = mapped_column(String(80), primary_key=True)
    value: Mapped[dict] = mapped_column(JSON, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    updated_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)


class SystemState(Base):
    """Estado global mutable del curso. Ej. `semester_state` (§17.0),
    `active_module_id`, `decimal_conversion_rate` (§5.4)."""

    __tablename__ = "system_state"

    key: Mapped[str] = mapped_column(String(80), primary_key=True)
    value: Mapped[dict] = mapped_column(JSON, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
