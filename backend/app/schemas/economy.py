"""Schemas Pydantic de Dominio 3 (economía)."""

from datetime import datetime

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
    descripcion: str | None
    categoria: str | None
    costo: int
    es_grupal: bool
    limites_config: dict | None
    visible: bool
    feature_flag_key: str | None
    created_at: datetime
    updated_at: datetime


class PrivilegeCatalogIn(BaseModel):
    nombre: str = Field(min_length=3, max_length=120)
    descripcion: str | None = None
    categoria: str | None = Field(default=None, max_length=50)
    costo: int = Field(ge=1)
    es_grupal: bool = False
    limites_config: dict | None = None
    visible: bool = True
    feature_flag_key: str | None = Field(default=None, max_length=80)


class PrivilegeCatalogUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=3, max_length=120)
    descripcion: str | None = None
    categoria: str | None = Field(default=None, max_length=50)
    costo: int | None = Field(default=None, ge=1)
    es_grupal: bool | None = None
    limites_config: dict | None = None
    visible: bool | None = None
    feature_flag_key: str | None = Field(default=None, max_length=80)


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
    refunded_at: datetime | None


class TicketOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    folio: str
    catalog_id: int
    initiator_user_id: int
    team_id: int | None
    costo_total: int
    pagado_total: int
    estado: TicketStatus
    created_at: datetime
    emitido_at: datetime | None
    consumido_at: datetime | None
    consumido_por_admin_id: int | None
    cancelled_at: datetime | None
    contribuciones: list[ContributionOut] = []


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
    referencia_tipo: str | None
    referencia_id: int | None
    nota: str | None
    admin_id: int | None
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
    entrega_ref: str | None
    decimas_solicitadas: int
    pts_costo: int
    estado: DecimalRequestStatus
    nota_profesor: str | None
    created_at: datetime
    resolved_at: datetime | None
    resolved_by: int | None


class DecimalRedemptionIn(BaseModel):
    entrega_descripcion: str = Field(min_length=1, max_length=200)
    entrega_ref: str | None = Field(default=None, max_length=50)
    decimas_solicitadas: int = Field(ge=1)


class ResolveDecimalIn(BaseModel):
    nota: str | None = Field(default=None, max_length=500)
