"""Endpoints de Dominio 3 accesibles a integrantes activos."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_active_user
from app.models.economy import (
    DecimalRedemptionRequest,
    PrivilegeCatalog,
    PrivilegeTicket,
    TicketStatus,
    TokenSource,
)
from app.models.user import User
from app.schemas.economy import (
    BalanceOut,
    ContributeIn,
    DecimalRedemptionIn,
    DecimalRedemptionOut,
    LedgerEntryOut,
    PrivilegeCatalogOut,
    SplitBillInitIn,
    TicketOut,
)
from app.services.tokens import (
    cancel_funding_ticket,
    contribute_to_ticket,
    get_balance,
    get_movements,
    get_user_tickets,
    initiate_split_bill,
    is_privilege_available_for_users,
    purchase_individual,
    request_decimal_redemption,
    user_owns_or_shares_ticket,
)

router = APIRouter(tags=["economy"])


# ---------------------------------------------------------------------------
# Saldo y movimientos
# ---------------------------------------------------------------------------


@router.get("/me/tokens", response_model=BalanceOut)
def my_tokens(
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> BalanceOut:
    balance = get_balance(db, user.id)
    recent = get_movements(db, user.id, limit=10)
    return BalanceOut(balance=balance, recent=[LedgerEntryOut.model_validate(m) for m in recent])


@router.get("/me/tokens/movements", response_model=list[LedgerEntryOut])
def my_movements(
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    fuente: list[TokenSource] | None = Query(default=None),
) -> list[LedgerEntryOut]:
    entries = get_movements(db, user.id, limit=limit, offset=offset, fuentes=fuente)
    return [LedgerEntryOut.model_validate(e) for e in entries]


# ---------------------------------------------------------------------------
# Catálogo visible
# ---------------------------------------------------------------------------


@router.get("/privileges", response_model=list[PrivilegeCatalogOut])
def list_visible_privileges(
    _user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> list[PrivilegeCatalog]:
    all_entries = db.scalars(
        select(PrivilegeCatalog).order_by(PrivilegeCatalog.categoria, PrivilegeCatalog.costo)
    ).all()
    return [e for e in all_entries if is_privilege_available_for_users(db, e)]


# ---------------------------------------------------------------------------
# Compras
# ---------------------------------------------------------------------------


@router.post("/privileges/{catalog_id}/purchase", response_model=TicketOut, status_code=status.HTTP_201_CREATED)
def purchase(
    catalog_id: int,
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> PrivilegeTicket:
    result = purchase_individual(db, user, catalog_id)
    return result.ticket


@router.post(
    "/privileges/{catalog_id}/split-bill/init",
    response_model=TicketOut,
    status_code=status.HTTP_201_CREATED,
)
def split_bill_init(
    catalog_id: int,
    payload: SplitBillInitIn,
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> PrivilegeTicket:
    result = initiate_split_bill(db, user, catalog_id, payload.amount)
    return result.ticket


# ---------------------------------------------------------------------------
# Tickets — mios y contribuciones
# ---------------------------------------------------------------------------


@router.get("/me/tickets", response_model=list[TicketOut])
def my_tickets(
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    estado: list[TicketStatus] | None = Query(default=None),
) -> list[PrivilegeTicket]:
    return get_user_tickets(db, user.id, estados=estado)


@router.get("/tickets/{ticket_id}", response_model=TicketOut)
def get_ticket(
    ticket_id: int,
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> PrivilegeTicket:
    ticket = db.get(PrivilegeTicket, ticket_id)
    if ticket is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket no existe.")
    if not (user.is_admin or user_owns_or_shares_ticket(db, user.id, ticket)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No autorizado a ver este ticket.",
        )
    return ticket


@router.post("/tickets/{ticket_id}/contribute", response_model=TicketOut)
def contribute(
    ticket_id: int,
    payload: ContributeIn,
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> PrivilegeTicket:
    return contribute_to_ticket(db, user, ticket_id, payload.amount)


@router.post("/tickets/{ticket_id}/cancel", response_model=TicketOut)
def cancel(
    ticket_id: int,
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> PrivilegeTicket:
    return cancel_funding_ticket(db, ticket_id, actor=user, by_admin=False)


# ---------------------------------------------------------------------------
# Décimas
# ---------------------------------------------------------------------------


@router.post(
    "/me/decimal-redemption",
    response_model=DecimalRedemptionOut,
    status_code=status.HTTP_201_CREATED,
)
def create_decimal_redemption(
    payload: DecimalRedemptionIn,
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> DecimalRedemptionRequest:
    return request_decimal_redemption(
        db,
        user,
        entrega_descripcion=payload.entrega_descripcion,
        decimas_solicitadas=payload.decimas_solicitadas,
        entrega_ref=payload.entrega_ref,
    )


@router.get("/me/decimal-redemption", response_model=list[DecimalRedemptionOut])
def my_decimal_redemptions(
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> list[DecimalRedemptionRequest]:
    return list(
        db.scalars(
            select(DecimalRedemptionRequest)
            .where(DecimalRedemptionRequest.user_id == user.id)
            .order_by(DecimalRedemptionRequest.created_at.desc())
        ).all()
    )
