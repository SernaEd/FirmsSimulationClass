"""Schemas Pydantic de Dominio 3 (economía)."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.economy import (
    DecimalRequestStatus,
    TicketStatus,
    TokenSource,
)

# ---------------------------------------------------------------------------
# Catálogo
# ---------------------------------------------------------------------------


class PrivilegeCatalogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    descripcion: Optional[str]
    categoria: Optional[str]
    costo: int
    es_grupal: bool
    limites_config: Optional[dict]
    visible: bool
    feature_flag_key: Optional[str]
    created_at: datetime
    updated_at: datetime


class PrivilegeCatalogIn(BaseModel):
    nombre: str = Field(min_length=3, max_length=120)
    descripcion: Optional[str] = None
    categoria: Optional[str] = Field(default=None, max_length=50)
    costo: int = Field(ge=1)
    es_grupal: bool = False
    limites_config: Optional[dict] = None
    visible: bool = True
    feature_flag_key: Optional[str] = Field(default=None, max_length=80)


class PrivilegeCatalogUpdate(BaseModel):
    nombre: Optional[str] = Field(default=None, min_length=3, max_length=120)
    descripcion: Optional[str] = None
    categoria: Optional[str] = Field(default=None, max_length=50)
    costo: Optional[int] = Field(default=None, ge=1)
    es_grupal: Optional[bool] = None
    limites_config: Optional[dict] = None
    visible: Optional[bool] = None
    feature_flag_key: Optional[str] = Field(default=None, max_length=80)


class SeedResult(BaseModel):
    creadas: int
    ya_existentes: int


# ---------------------------------------------------------------------------
# Tickets
# ---------------------------------------------------------------------------


class ContributionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    amount: int
    created_at: datetime
    refunded_at: Optional[datetime]


class TicketOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    folio: str
    catalog_id: int
    initiator_user_id: int
    team_id: Optional[int]
    costo_total: int
    pagado_total: int
    estado: TicketStatus
    created_at: datetime
    emitido_at: Optional[datetime]
    consumido_at: Optional[datetime]
    consumido_por_admin_id: Optional[int]
    cancelled_at: Optional[datetime]
    contribuciones: list[ContributionOut] = []

    initiator_name: Optional[str] = None
    catalog_name: Optional[str] = None


class SplitBillInitIn(BaseModel):
    amount: int = Field(ge=1, description="Aportación inicial de quien inicia.")


class ContributeIn(BaseModel):
    amount: int = Field(ge=1)


# ---------------------------------------------------------------------------
# Ledger / saldo
# ---------------------------------------------------------------------------


class LedgerEntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    delta: int
    fuente: TokenSource
    referencia_tipo: Optional[str]
    referencia_id: Optional[int]
    nota: Optional[str]
    admin_id: Optional[int]
    created_at: datetime


class BalanceOut(BaseModel):
    balance: int
    recent: list[LedgerEntryOut]


class AdjustTokensIn(BaseModel):
    user_id: int
    delta: int = Field(description="Positivo suma; negativo resta. Distinto de 0.")
    nota: str = Field(min_length=1, max_length=500)


# ---------------------------------------------------------------------------
# Décimas
# ---------------------------------------------------------------------------


class DecimalRedemptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    entrega_descripcion: str
    entrega_ref: Optional[str]
    decimas_solicitadas: int
    pts_costo: int
    estado: DecimalRequestStatus
    nota_profesor: Optional[str]
    created_at: datetime
    resolved_at: Optional[datetime]
    resolved_by: Optional[int]

    user_name: Optional[str] = None


class DecimalRedemptionIn(BaseModel):
    entrega_descripcion: str = Field(min_length=1, max_length=200)
    entrega_ref: Optional[str] = Field(default=None, max_length=50)
    decimas_solicitadas: int = Field(ge=1)


class ResolveDecimalIn(BaseModel):
    nota: Optional[str] = Field(default=None, max_length=500)
