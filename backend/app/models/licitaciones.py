"""Modelos de licitaciones — simulación numérica de casos de ingeniería
aplicada (§10 y §12.6 del plan v2; ver `casos_licitaciones.md` para el
banco de casos reales).

Convenciones y alcance de esta primera versión:
- `Caso` guarda los parámetros numéricos de un caso del banco, editable
  desde admin (mismo patrón que `PrivilegeCatalog`). `tipo_modelo`
  discrimina qué solver de `services/licitaciones.py` aplica; hoy solo
  existe `mezcla_lineal_tanque` (Caso 1 — biorreactor, purga con corriente
  limpia, `A(t) = A0 * exp(-Q*t/V)`) y el schema no admite otro valor, así
  que el CRUD de casos no puede crear uno que el backend no sepa simular.
  Un caso futuro con otra EDO necesita su propio valor de `tipo_modelo` Y
  su propio solver.
- `Licitacion` es una instancia de un caso abierta a todo el curso.
  Simplificación deliberada respecto al diseño original de §10: no modela
  la fase de "planteo" (borrador no calificado) ni el motor WebSocket de
  podio en tiempo real entre envíos concurrentes — cada equipo manda una
  única respuesta final por REST, y el podio se calcula al cerrar por
  orden de llegada (`created_at`) entre las respuestas correctas. El
  motor de tiempo real (§10 "Notas técnicas") queda como trabajo futuro.
- `LicitacionResponse` es la respuesta (una por equipo, no editable) con
  el resultado de la simulación ya evaluado en el momento del envío.
- Los Tokens del podio se otorgan a los integrantes *activos* del equipo
  al cerrar la licitación — no existe todavía un sistema de asistencia
  ("presentes en clase", §10) en el codebase, así que esa distinción no
  se aplica aquí.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SQLEnum,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class EstadoLicitacion(str, Enum):
    abierta = "abierta"
    cerrada = "cerrada"


class TipoModeloCaso(str, Enum):
    """Discrimina qué solver de `services/licitaciones.py` sabe simular un
    `Caso`. Hoy solo existe un valor porque solo hay un solver implementado
    (mezcla lineal en tanque, `simular_tanque`); `CasoIn`/`CasoUpdate`
    (`schemas/licitaciones.py`) solo aceptan este valor, así que no puede
    persistirse un caso cuyo tipo de modelo el backend no sepa simular
    todavía. Agregar un segundo caso con otra EDO requiere agregar aquí el
    nuevo valor Y su propio solver — nunca reutilizar `simular_tanque` para
    una física distinta.
    """

    mezcla_lineal_tanque = "mezcla_lineal_tanque"


class Caso(Base):
    """Caso del banco (`casos_licitaciones.md`) con sus parámetros numéricos."""

    __tablename__ = "casos"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    numero: Mapped[int] = mapped_column(Integer, nullable=False, unique=True)
    titulo: Mapped[str] = mapped_column(String(200), nullable=False)
    modulo: Mapped[str] = mapped_column(String(200), nullable=False)
    contexto: Mapped[str] = mapped_column(Text, nullable=False)
    tipo_modelo: Mapped[TipoModeloCaso] = mapped_column(
        SQLEnum(TipoModeloCaso, native_enum=False, length=30),
        nullable=False,
        default=TipoModeloCaso.mezcla_lineal_tanque,
    )

    # Parámetros del modelo de mezcla lineal (dA/dt = -(Q/V)*A).
    volumen_l: Mapped[float] = mapped_column(Float, nullable=False)
    concentracion_inicial: Mapped[float] = mapped_column(Float, nullable=False)
    concentracion_max: Mapped[float] = mapped_column(Float, nullable=False)
    plazo_horas: Mapped[float] = mapped_column(Float, nullable=False)
    presion_max_q: Mapped[float] = mapped_column(Float, nullable=False)

    # Consecuencias tangibles (§ objetivo: dinero/personas, no solo la gráfica).
    dinero_perdido_mxn: Mapped[float] = mapped_column(Float, nullable=False)
    pacientes_afectados: Mapped[int] = mapped_column(Integer, nullable=False)
    costo_reparacion_mxn: Mapped[float] = mapped_column(Float, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    licitaciones: Mapped[List["Licitacion"]] = relationship(back_populates="caso")

    def __repr__(self) -> str:
        return f"<Caso #{self.numero} {self.titulo}>"


class Licitacion(Base):
    """Una licitación abierta sobre un `Caso`. Solo puede haber una
    `abierta` a la vez (validado en el servicio, no en BD)."""

    __tablename__ = "licitaciones"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    caso_id: Mapped[int] = mapped_column(ForeignKey("casos.id"), nullable=False)
    estado: Mapped[EstadoLicitacion] = mapped_column(
        SQLEnum(EstadoLicitacion, native_enum=False, length=20),
        nullable=False,
        default=EstadoLicitacion.abierta,
        index=True,
    )

    # Podio (§10) — puntos por posición; el profesor los puede ajustar al
    # abrir según la dificultad del caso. Defaults = valores sugeridos en §10.
    pts_primero: Mapped[int] = mapped_column(Integer, nullable=False, default=40)
    pts_segundo: Mapped[int] = mapped_column(Integer, nullable=False, default=25)
    pts_tercero: Mapped[int] = mapped_column(Integer, nullable=False, default=18)
    pts_correcta_fuera_podio: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    pts_participacion: Mapped[int] = mapped_column(Integer, nullable=False, default=5)

    abierta_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    cerrada_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    caso: Mapped[Caso] = relationship(back_populates="licitaciones")
    respuestas: Mapped[List["LicitacionResponse"]] = relationship(
        back_populates="licitacion", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Licitacion #{self.id} caso={self.caso_id} ({self.estado.value})>"


class LicitacionResponse(Base):
    """Respuesta final de un equipo a una licitación (una por equipo, sin
    edición posterior — igual que una entrega real de licitación).

    `resultado` guarda el resultado completo de la simulación (serie de
    tiempo + banderas + consecuencia) evaluado con la Q enviada: es un
    cálculo determinista, no un estado mutable independiente, así que no
    hace falta recalcularlo cada vez que se lista.
    """

    __tablename__ = "licitacion_responses"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    licitacion_id: Mapped[int] = mapped_column(
        ForeignKey("licitaciones.id", ondelete="CASCADE"), nullable=False
    )
    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id"), nullable=False)
    submitted_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    q_propuesta: Mapped[float] = mapped_column(Float, nullable=False)
    resultado: Mapped[dict] = mapped_column(JSON, nullable=False)
    correcta: Mapped[bool] = mapped_column(Boolean, nullable=False)

    orden_llegada: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    puntos_tokens: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )

    licitacion: Mapped[Licitacion] = relationship(back_populates="respuestas")

    __table_args__ = (
        UniqueConstraint("licitacion_id", "team_id", name="uq_licitacion_response_team"),
    )

    def __repr__(self) -> str:
        return f"<LicitacionResponse licitacion={self.licitacion_id} team={self.team_id}>"
