"""Modelos de contenido — módulos, sesiones de clase y comentarios (Iteración 1).

Cubren la Vista de Clase: apuntes sincronizados desde Notion (sección
superior), PDF de apuntes del profesor desde GDrive (sección media) y
comentarios estilo YouTube (sección inferior). Ver plan_de_tareas_mvp.md
> Iteración 1 y implementation_plan_v2.md §12.6.

Convenciones:
- `Module` agrupa sesiones y controla el desbloqueo progresivo del curso
  (`unlocked_at` nulo = aún bloqueado).
- `CourseSession` es la unidad sincronizable con Notion; `notion_page_id`
  se captura al crear la sesión (el admin la vincula a su sub-página en
  Notion desde el inicio) y `notion_last_sync` queda nulo hasta la primera
  sincronización.
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
        back_populates="module", cascade="all, delete-orphan"
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

    notion_page_id: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    apuntes_pdf_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notion_last_sync: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    module: Mapped[Module] = relationship(back_populates="sessions")
    posts: Mapped[list["ForumPost"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("module_id", "numero_sesion", name="uq_session_module_numero"),
    )

    def __repr__(self) -> str:
        return f"<CourseSession {self.titulo}>"


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
