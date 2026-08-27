"""Schemas Pydantic de licitaciones (§10, §12.6)."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.licitaciones import EstadoLicitacion, TipoModeloCaso


# ---------------------------------------------------------------------------
# Casos
# ---------------------------------------------------------------------------

class CasoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    numero: int
    titulo: str
    modulo: str
    contexto: str
    tipo_modelo: TipoModeloCaso
    volumen_l: float
    concentracion_inicial: float
    concentracion_max: float
    plazo_horas: float
    presion_max_q: float


class CasoIn(BaseModel):
    numero: int = Field(ge=1)
    titulo: str = Field(min_length=1, max_length=200)
    modulo: str = Field(min_length=1, max_length=200)
    contexto: str = Field(min_length=1)
    # Único valor soportado hoy (ver TipoModeloCaso) — Pydantic rechaza
    # cualquier otro, así que no puede crearse un caso que `simular_tanque`
    # no sepa resolver.
    tipo_modelo: TipoModeloCaso = TipoModeloCaso.mezcla_lineal_tanque
    volumen_l: float = Field(gt=0)
    concentracion_inicial: float = Field(gt=0)
    concentracion_max: float = Field(gt=0)
    plazo_horas: float = Field(gt=0)
    presion_max_q: float = Field(gt=0)
    dinero_perdido_mxn: float = Field(ge=0)
    pacientes_afectados: int = Field(ge=0)
    costo_reparacion_mxn: float = Field(ge=0)


class CasoAdminOut(CasoOut):
    """Como `CasoOut`, pero incluye las consecuencias (dinero, pacientes,
    costo de reparación) — se ocultan del alumnado en `CasoOut` para no
    revelar la severidad antes de responder, pero el admin sí necesita
    verlas y editarlas."""

    dinero_perdido_mxn: float
    pacientes_afectados: int
    costo_reparacion_mxn: float


class CasoUpdate(BaseModel):
    numero: Optional[int] = Field(default=None, ge=1)
    titulo: Optional[str] = Field(default=None, min_length=1, max_length=200)
    modulo: Optional[str] = Field(default=None, min_length=1, max_length=200)
    contexto: Optional[str] = Field(default=None, min_length=1)
    tipo_modelo: Optional[TipoModeloCaso] = None
    volumen_l: Optional[float] = Field(default=None, gt=0)
    concentracion_inicial: Optional[float] = Field(default=None, gt=0)
    concentracion_max: Optional[float] = Field(default=None, gt=0)
    plazo_horas: Optional[float] = Field(default=None, gt=0)
    presion_max_q: Optional[float] = Field(default=None, gt=0)
    dinero_perdido_mxn: Optional[float] = Field(default=None, ge=0)
    pacientes_afectados: Optional[int] = Field(default=None, ge=0)
    costo_reparacion_mxn: Optional[float] = Field(default=None, ge=0)


# ---------------------------------------------------------------------------
# Simulación
# ---------------------------------------------------------------------------

class SimulacionResultadoOut(BaseModel):
    a_final: float
    cumple_plazo: bool
    cumple_presion: bool
    correcta: bool
    consecuencia: str
    dinero_perdido_mxn: float
    pacientes_afectados: int
    costo_reparacion_mxn: float


# ---------------------------------------------------------------------------
# Licitaciones
# ---------------------------------------------------------------------------

class LicitacionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    estado: EstadoLicitacion
    caso: CasoOut
    pts_primero: int
    pts_segundo: int
    pts_tercero: int
    pts_correcta_fuera_podio: int
    pts_participacion: int
    abierta_at: datetime
    cerrada_at: Optional[datetime]


class LicitacionAbrirIn(BaseModel):
    caso_id: int
    pts_primero: int = Field(default=40, ge=0)
    pts_segundo: int = Field(default=25, ge=0)
    pts_tercero: int = Field(default=18, ge=0)
    pts_correcta_fuera_podio: int = Field(default=10, ge=0)
    pts_participacion: int = Field(default=5, ge=0)


# ---------------------------------------------------------------------------
# Respuestas
# ---------------------------------------------------------------------------

class LicitacionResponseIn(BaseModel):
    q: float = Field(gt=0, description="Caudal de purga propuesto (L/h).")


class LicitacionResponseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    licitacion_id: int
    team_id: int
    submitted_by: int
    q_propuesta: float
    resultado: SimulacionResultadoOut
    correcta: bool
    orden_llegada: Optional[int]
    puntos_tokens: Optional[int]
    created_at: datetime
