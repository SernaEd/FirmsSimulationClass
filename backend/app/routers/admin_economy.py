"""Endpoints admin de Dominio 3."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.deps import get_current_admin
from app.models.economy import (
    DecimalRedemptionRequest,
    DecimalRequestStatus,
    PrivilegeCatalog,
    PrivilegeTicket,
    TicketStatus,
)
from app.models.user import User
from app.schemas.economy import (
    AdjustTokensIn,
    DecimalRedemptionOut,
    LedgerEntryOut,
    PrivilegeCatalogIn,
    PrivilegeCatalogOut,
    PrivilegeCatalogUpdate,
    ResolveDecimalIn,
    SeedResult,
    TicketOut,
)
from app.services.tokens import (
    adjust_tokens,
    cancel_funding_ticket,
    consume_ticket_by_folio,
    resolve_decimal_request,
    seed_default_catalog,
)

router = APIRouter(prefix="/admin", tags=["admin:economy"])


# ---------------------------------------------------------------------------
# Catálogo (CRUD)
# ---------------------------------------------------------------------------


@router.get("/privileges", response_model=list[PrivilegeCatalogOut])
def admin_list_privileges(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[PrivilegeCatalog]:
    return list(
        db.scalars(
            select(PrivilegeCatalog).order_by(
                PrivilegeCatalog.categoria, PrivilegeCatalog.costo
            )
        ).all()
    )


@router.post("/privileges", response_model=PrivilegeCatalogOut, status_code=status.HTTP_201_CREATED)
def admin_create_privilege(
    payload: PrivilegeCatalogIn,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PrivilegeCatalog:
    existing = db.scalar(
        select(PrivilegeCatalog).where(PrivilegeCatalog.nombre == payload.nombre)
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe un privilegio con el nombre '{payload.nombre}'.",
        )
    entry = PrivilegeCatalog(**payload.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.patch("/privileges/{catalog_id}", response_model=PrivilegeCatalogOut)
def admin_update_privilege(
    catalog_id: int,
    payload: PrivilegeCatalogUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PrivilegeCatalog:
    entry = db.get(PrivilegeCatalog, catalog_id)
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Privilegio no existe.")

    data = payload.model_dump(exclude_unset=True)
    if "nombre" in data and data["nombre"] != entry.nombre:
        other = db.scalar(
            select(PrivilegeCatalog).where(
                PrivilegeCatalog.nombre == data["nombre"],
                PrivilegeCatalog.id != catalog_id,
            )
        )
        if other is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Ya existe otro privilegio con el nombre '{data['nombre']}'.",
            )
    for k, v in data.items():
        setattr(entry, k, v)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/privileges/{catalog_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_privilege(
    catalog_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> None:
    entry = db.get(PrivilegeCatalog, catalog_id)
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Privilegio no existe.")
    # Chequeo suave: si tiene tickets asociados, mejor ocultarlo que eliminarlo.
    has_tickets = db.scalar(
        select(PrivilegeTicket.id).where(PrivilegeTicket.catalog_id == catalog_id).limit(1)
    )
    if has_tickets is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Este privilegio ya tiene tickets emitidos. En vez de eliminarlo, "
                "cámbialo a `visible=false` para ocultarlo del catálogo."
            ),
        )
    db.delete(entry)
    db.commit()


@router.post("/privileges/seed-defaults", response_model=SeedResult)
def admin_seed_defaults(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> SeedResult:
    creadas, ya_existentes = seed_default_catalog(db)
    return SeedResult(creadas=creadas, ya_existentes=ya_existentes)


# ---------------------------------------------------------------------------
# Tickets
# ---------------------------------------------------------------------------


@router.get("/tickets", response_model=list[TicketOut])
def admin_list_tickets(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
    estado: list[TicketStatus] | None = Query(default=None),
    limit: int = Query(200, ge=1, le=1000),
) -> list[PrivilegeTicket]:
    stmt = (
        select(PrivilegeTicket)
        .options(
            selectinload(PrivilegeTicket.contribuciones),
            selectinload(PrivilegeTicket.initiator),
            selectinload(PrivilegeTicket.catalog),
        )
        .order_by(PrivilegeTicket.created_at.desc())
        .limit(limit)
    )
    if estado:
        stmt = stmt.where(PrivilegeTicket.estado.in_(estado))
    return list(db.scalars(stmt).unique().all())


@router.post("/tickets/{folio}/consume", response_model=TicketOut)
def admin_consume_ticket(
    folio: str,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> PrivilegeTicket:
    return consume_ticket_by_folio(db, admin, folio)


@router.post("/tickets/{ticket_id}/cancel", response_model=TicketOut)
def admin_cancel_ticket(
    ticket_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> PrivilegeTicket:
    return cancel_funding_ticket(db, ticket_id, actor=admin, by_admin=True)


# ---------------------------------------------------------------------------
# Ajuste manual de Tokens
# ---------------------------------------------------------------------------


@router.post("/tokens/adjust", response_model=LedgerEntryOut, status_code=status.HTTP_201_CREATED)
def admin_adjust_tokens(
    payload: AdjustTokensIn,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> LedgerEntryOut:
    entry = adjust_tokens(db, admin, payload.user_id, payload.delta, payload.nota)
    return LedgerEntryOut.model_validate(entry)


# ---------------------------------------------------------------------------
# Décimas
# ---------------------------------------------------------------------------


@router.get("/decimal-redemption/pending", response_model=list[DecimalRedemptionOut])
def admin_list_pending_decimals(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[DecimalRedemptionRequest]:
    return list(
        db.scalars(
            select(DecimalRedemptionRequest)
            .options(selectinload(DecimalRedemptionRequest.user))
            .where(DecimalRedemptionRequest.estado == DecimalRequestStatus.pendiente)
            .order_by(DecimalRedemptionRequest.created_at.asc())
        ).all()
    )


@router.post("/decimal-redemption/{request_id}/approve", response_model=DecimalRedemptionOut)
def admin_approve_decimal(
    request_id: int,
    payload: ResolveDecimalIn | None = None,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> DecimalRedemptionRequest:
    nota = payload.nota if payload else None
    return resolve_decimal_request(db, request_id, admin, aprobar=True, nota=nota)


@router.post("/decimal-redemption/{request_id}/reject", response_model=DecimalRedemptionOut)
def admin_reject_decimal(
    request_id: int,
    payload: ResolveDecimalIn | None = None,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> DecimalRedemptionRequest:
    nota = payload.nota if payload else None
    return resolve_decimal_request(db, request_id, admin, aprobar=False, nota=nota)
