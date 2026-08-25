"""Modelos de contenido — módulos, sesiones de clase y comentarios (Iteración 1).

Cubren la Vista de Clase: descripción editada por el admin (sección
superior), adjuntos subidos por el admin — PDF/PPTX/Word/imágenes de la
clase (sección media) y comentarios estilo YouTube (sección inferior, aún
sin construir). Ver plan_de_tareas_mvp.md > Iteración 1.

Convenciones:
- `Module` agrupa sesiones y controla el desbloqueo progresivo del curso
  (`unlocked_at` nulo = aún bloqueado).
- `CourseSession` se edita directo en la plataforma (título + descripción
  libre); `SessionAttachment` guarda los archivos que el admin sube para
  esa sesión.
- `ForumPost` cuelga de la sesión, no del módulo, y admite hilos simples
  vía `parent_post_id` (comentario / respuesta, sin anidamiento profundo).
"""

from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Module(Base):
    __tablename__ = "modules"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    numero: Mapped[int] = mapped_column(Integer, nullable=False, unique=True)
    nombre: Mapped[str] = mapped_column(String(120), nullable=False)
    unlocked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    sessions: Mapped[list["CourseSession"]] = relationship(
        back_populates="module", cascade="all, delete-orphan", order_by="CourseSession.numero_sesion"
    )

    def __repr__(self) -> str:
        return f"<Module {self.numero}: {self.nombre}>"


class CourseSession(Base):
    __tablename__ = "course_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    module_id: Mapped[int] = mapped_column(
        ForeignKey("modules.id", ondelete="CASCADE"), nullable=False
    )
    numero_sesion: Mapped[int] = mapped_column(Integer, nullable=False)
    titulo: Mapped[str] = mapped_column(String(200), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    # URL (relativa, p. ej. "/clase1-content/index.html", o absoluta) de una
    # presentación/deck interactivo para embeber en un iframe — a diferencia
    # de SessionAttachment (un archivo subido y descargable), esto apunta a
    # contenido servido aparte (típicamente un asset estático). Nace de
    # consolidar /clase1 (página standalone, hardcoded) dentro de este
    # sistema — ver UiDesign/README.md.
    embed_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    module: Mapped[Module] = relationship(back_populates="sessions")
    posts: Mapped[list["ForumPost"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )
    attachments: Mapped[list["SessionAttachment"]] = relationship(
        back_populates="session", cascade="all, delete-orphan", order_by="SessionAttachment.created_at"
    )

    __table_args__ = (
        UniqueConstraint("module_id", "numero_sesion", name="uq_session_module_numero"),
    )

    def __repr__(self) -> str:
        return f"<CourseSession {self.titulo}>"


class SessionAttachment(Base):
    __tablename__ = "session_attachments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    session_id: Mapped[int] = mapped_column(
        ForeignKey("course_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )

    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    content_type: Mapped[str] = mapped_column(String(100), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    # Ruta al PDF generado por LibreOffice para un PPT/PPTX (ver
    # save_attachment). Nulo si el adjunto ya es PDF (se previsualiza a sí
    # mismo, no necesita esta columna) o si la conversión falló/no aplica.
    preview_path: Mapped[str | None] = mapped_column(String(500), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    session: Mapped[CourseSession] = relationship(back_populates="attachments")

    @property
    def preview_available(self) -> bool:
        """True si /attachments/{id}/preview puede servir algo — el propio
        PDF si ya lo es, o el PDF convertido si existe. Pydantic (from_attributes)
        lee esto como cualquier otro atributo, sin duplicar la regla en el schema."""
        return self.content_type == "application/pdf" or self.preview_path is not None

    def __repr__(self) -> str:
        return f"<SessionAttachment {self.filename} (session {self.session_id})>"


class ForumPost(Base):
    __tablename__ = "forum_posts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    session_id: Mapped[int] = mapped_column(
        ForeignKey("course_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    parent_post_id: Mapped[int | None] = mapped_column(
        ForeignKey("forum_posts.id", ondelete="CASCADE"), nullable=True, index=True
    )

    cuerpo: Mapped[str] = mapped_column(Text, nullable=False)
    es_anonimo_para_pares: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    destacado: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    session: Mapped[CourseSession] = relationship(back_populates="posts")

    def __repr__(self) -> str:
        return f"<ForumPost #{self.id} en session {self.session_id}>"
