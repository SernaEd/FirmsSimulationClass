"""Lógica de negocio de Dominio 3 (economía de Tokens).

- Cálculo de saldo y movimientos desde el ledger append-only.
- Compra individual y Split Bill (compras grupales por aportación).
- Cancelación con reembolso.
- Consumo de tickets por admin.
- Ajustes manuales de Tokens con nota justificativa.
- Validación de topes (`limites_config`) del catálogo.
- Solicitudes de canje de Tokens por décimas.
"""

from __future__ import annotations

import secrets
import string
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Iterable

from fastapi import HTTPException, status
from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session, selectinload

from app.models.economy import (
    DecimalRedemptionRequest,
    DecimalRequestStatus,
    PrivilegeCatalog,
    PrivilegeTicket,
    SplitBillContribution,
    TicketStatus,
    TokenLedger,
    TokenSource,
)
from app.models.user import User
from app.services.teams import get_active_team_of_user, user_is_member_of_team


# =========================================================================
# Helpers de ledger
# =========================================================================

def get_balance(db: Session, user_id: int) -> int:
    """Saldo actual = suma de deltas del ledger."""
    result = db.execute(
        select(func.coalesce(func.sum(TokenLedger.delta), 0)).where(
            TokenLedger.user_id == user_id
        )
    ).scalar_one()
    return int(result)


def get_movements(
    db: Session,
    user_id: int,
    limit: int = 50,
    offset: int = 0,
    fuentes: list[TokenSource] | None = None,
) -> list[TokenLedger]:
    stmt = select(TokenLedger).where(TokenLedger.user_id == user_id)
    if fuentes:
        stmt = stmt.where(TokenLedger.fuente.in_(fuentes))
    stmt = stmt.order_by(TokenLedger.created_at.desc()).limit(limit).offset(offset)
    return list(db.scalars(stmt).all())


def _add_ledger_entry(
    db: Session,
    *,
    user_id: int,
    delta: int,
    fuente: TokenSource,
    referencia_tipo: str | None = None,
    referencia_id: int | None = None,
    nota: str | None = None,
    admin_id: int | None = None,
) -> TokenLedger:
    entry = TokenLedger(
        user_id=user_id,
        delta=delta,
        fuente=fuente,
        referencia_tipo=referencia_tipo,
        referencia_id=referencia_id,
        nota=nota,
        admin_id=admin_id,
    )
    db.add(entry)
    return entry


# =========================================================================
# Catálogo — validaciones
# =========================================================================

def is_privilege_available_for_users(db: Session, catalog: PrivilegeCatalog) -> bool:
    """Un privilegio es visible al alumnado si `visible=True` y, cuando tiene
    un feature flag asociado (ej. `ai_in_exam_enabled`, §5.2), ese flag está
    encendido en `SystemFlag`. Ausencia del flag = desactivado (safe default).
    """
    if not catalog.visible:
        return False
    if catalog.feature_flag_key:
        from app.services.system_config import get_flag  # import perezoso: evita ciclo

        return get_flag(db, catalog.feature_flag_key)
    return True


def check_semester_limits(db: Session, user_id: int, catalog: PrivilegeCatalog) -> None:
    """Valida el tope `por_semestre` de `limites_config`. Los topes por-tarea
    y por-examen se validan cuando lleguen esos entities en Iteración 3.
    """
    limits = catalog.limites_config or {}
    por_semestre = limits.get("por_semestre")
    if por_semestre is None:
        return

    count = db.scalar(
        select(func.count(PrivilegeTicket.id))
        .where(PrivilegeTicket.catalog_id == catalog.id)
        .where(PrivilegeTicket.initiator_user_id == user_id)
        .where(
            PrivilegeTicket.estado.in_(
                [TicketStatus.emitted, TicketStatus.consumed, TicketStatus.funding]
            )
        )
    )
    if count is not None and count >= por_semestre:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Ya alcanzaste el tope de {por_semestre} de este privilegio "
                "para el semestre."
            ),
        )


def _resolve_available_catalog_entry(db: Session, catalog_id: int) -> PrivilegeCatalog:
    catalog = db.get(PrivilegeCatalog, catalog_id)
    if catalog is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Privilegio no existe.")
    if not is_privilege_available_for_users(db, catalog):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Este privilegio no está disponible actualmente.",
        )
    return catalog


# =========================================================================
# Folios únicos
# =========================================================================

_FOLIO_ALPHABET = string.ascii_uppercase + string.digits
_FOLIO_LEN = 8


def _generate_unique_folio(db: Session) -> str:
    for _ in range(10):
        candidate = "".join(secrets.choice(_FOLIO_ALPHABET) for _ in range(_FOLIO_LEN))
        exists = db.scalar(
            select(PrivilegeTicket.id).where(PrivilegeTicket.folio == candidate)
        )
        if exists is None:
            return candidate
    raise RuntimeError("No se pudo generar un folio único tras 10 intentos.")


# =========================================================================
# Compra individual
# =========================================================================

@dataclass
class PurchaseResult:
    ticket: PrivilegeTicket


def purchase_individual(
    db: Session, user: User, catalog_id: int
) -> PurchaseResult:
    catalog = _resolve_available_catalog_entry(db, catalog_id)

    if catalog.es_grupal:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Este privilegio es grupal. Inicia un Split Bill desde tu equipo."
            ),
        )

    balance = get_balance(db, user.id)
    if balance < catalog.costo:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Saldo insuficiente. Requieres {catalog.costo} Tks, tienes {balance}.",
        )

    check_semester_limits(db, user.id, catalog)

    now = datetime.now(timezone.utc)
    ticket = PrivilegeTicket(
        folio=_generate_unique_folio(db),
        catalog_id=catalog.id,
        initiator_user_id=user.id,
        team_id=None,
        costo_total=catalog.costo,
        pagado_total=catalog.costo,
        estado=TicketStatus.emitted,
        emitido_at=now,
    )
    db.add(ticket)
    db.flush()  # necesitamos ticket.id para las FKs siguientes

    db.add(
        SplitBillContribution(
            ticket_id=ticket.id, user_id=user.id, amount=catalog.costo
        )
    )
    _add_ledger_entry(
        db,
        user_id=user.id,
        delta=-catalog.costo,
        fuente=TokenSource.canje_privilegio,
        referencia_tipo="ticket",
        referencia_id=ticket.id,
        nota=f"Compra individual: {catalog.nombre}",
    )

    db.commit()
    db.refresh(ticket)
    return PurchaseResult(ticket=ticket)


# =========================================================================
# Split Bill
# =========================================================================

def initiate_split_bill(
    db: Session, user: User, catalog_id: int, first_amount: int
) -> PurchaseResult:
    catalog = _resolve_available_catalog_entry(db, catalog_id)

    if not catalog.es_grupal:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este privilegio no es grupal; usa la compra individual.",
        )

    team = get_active_team_of_user(db, user.id)
    if team is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No tienes equipo activo. Un Split Bill requiere formar parte de un equipo.",
        )

    # Solo puede haber un Split Bill en proceso (funding) por equipo para el mismo privilegio a la vez
    active_funding = db.scalar(
        select(PrivilegeTicket.id).where(
            PrivilegeTicket.team_id == team.id,
            PrivilegeTicket.catalog_id == catalog.id,
            PrivilegeTicket.estado == TicketStatus.funding
        )
    )
    if active_funding:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Tu equipo ya tiene un ticket en financiamiento para este mismo privilegio. Deben completarlo o cancelarlo antes de iniciar otro.",
        )

    if first_amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La aportación inicial debe ser mayor que 0.",
        )
    if first_amount > catalog.costo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La aportación excede el costo total ({catalog.costo} Tks).",
        )

    balance = get_balance(db, user.id)
    if balance < first_amount:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Saldo insuficiente. Requieres {first_amount} Tks, tienes {balance}.",
        )

    # El tope por semestre lo carga quien inicia (el "dueño" del ticket).
    check_semester_limits(db, user.id, catalog)

    now = datetime.now(timezone.utc)
    fully_funded = first_amount >= catalog.costo
    ticket = PrivilegeTicket(
        folio=_generate_unique_folio(db),
        catalog_id=catalog.id,
        initiator_user_id=user.id,
        team_id=team.id,
        costo_total=catalog.costo,
        pagado_total=first_amount,
        estado=TicketStatus.emitted if fully_funded else TicketStatus.funding,
        emitido_at=now if fully_funded else None,
    )
    db.add(ticket)
    db.flush()

    db.add(SplitBillContribution(ticket_id=ticket.id, user_id=user.id, amount=first_amount))
    _add_ledger_entry(
        db,
        user_id=user.id,
        delta=-first_amount,
        fuente=TokenSource.canje_privilegio,
        referencia_tipo="ticket",
        referencia_id=ticket.id,
        nota=f"Aportación inicial split bill: {catalog.nombre}",
    )
    db.commit()
    db.refresh(ticket)
    return PurchaseResult(ticket=ticket)


def contribute_to_ticket(
    db: Session, user: User, ticket_id: int, amount: int
) -> PrivilegeTicket:
    ticket = db.get(PrivilegeTicket, ticket_id)
    if ticket is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket no existe.")
    if ticket.estado != TicketStatus.funding:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"El ticket está en estado '{ticket.estado.value}', ya no acepta aportaciones.",
        )
    if ticket.team_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ticket individual, no admite aportaciones adicionales.",
        )
    if not user_is_member_of_team(db, user.id, ticket.team_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo integrantes del equipo pueden aportar a este ticket.",
        )

    if amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La aportación debe ser mayor que 0.",
        )

    # Revisar si ya hay una aportación activa
    existing_contrib = db.scalar(
        select(SplitBillContribution).where(
            SplitBillContribution.ticket_id == ticket.id,
            SplitBillContribution.user_id == user.id,
            SplitBillContribution.refunded_at.is_(None),
        )
    )

    current_amount = existing_contrib.amount if existing_contrib else 0
    delta = amount - current_amount

    if delta == 0:
        return ticket

    remaining = ticket.costo_total - ticket.pagado_total
    if delta > remaining:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El incremento excede lo restante ({remaining} Tks).",
        )

    if delta > 0:
        balance = get_balance(db, user.id)
        if balance < delta:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=f"Saldo insuficiente. Requieres {delta} Tks adicionales, tienes {balance}.",
            )

    if existing_contrib:
        existing_contrib.amount = amount
    else:
        db.add(SplitBillContribution(ticket_id=ticket.id, user_id=user.id, amount=amount))

    ticket.pagado_total += delta
    # delta > 0 = aumenta su aportación (gasto); delta < 0 = la reduce (reembolso
    # parcial). Distinguimos la fuente para que los reportes por fuente (§17.1)
    # no mezclen gasto real con reembolsos.
    if delta > 0:
        _add_ledger_entry(
            db,
            user_id=user.id,
            delta=-delta,
            fuente=TokenSource.canje_privilegio,
            referencia_tipo="ticket",
            referencia_id=ticket.id,
            nota=f"Aportación split bill: ticket {ticket.folio}",
        )
    else:
        _add_ledger_entry(
            db,
            user_id=user.id,
            delta=-delta,
            fuente=TokenSource.split_bill_refund,
            referencia_tipo="ticket",
            referencia_id=ticket.id,
            nota=f"Reducción de aportación split bill: ticket {ticket.folio}",
        )

    if ticket.pagado_total >= ticket.costo_total:
        ticket.estado = TicketStatus.emitted
        ticket.emitido_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(ticket)
    return ticket


def cancel_funding_ticket(
    db: Session, ticket_id: int, actor: User, by_admin: bool = False
) -> PrivilegeTicket:
    ticket = db.get(PrivilegeTicket, ticket_id, options=[selectinload(PrivilegeTicket.contribuciones)])
    if ticket is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket no existe.")
    if ticket.estado != TicketStatus.funding:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Solo se pueden cancelar tickets en estado 'funding' (actual: '{ticket.estado.value}').",
        )
    if not by_admin and actor.id != ticket.initiator_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo quien inició el ticket (o un admin) puede cancelarlo.",
        )

    now = datetime.now(timezone.utc)
    for c in ticket.contribuciones:
        if c.refunded_at is None:
            c.refunded_at = now
            _add_ledger_entry(
                db,
                user_id=c.user_id,
                delta=c.amount,
                fuente=TokenSource.split_bill_refund,
                referencia_tipo="ticket",
                referencia_id=ticket.id,
                nota=f"Reembolso por cancelación de ticket {ticket.folio}",
                admin_id=actor.id if by_admin else None,
            )
    ticket.estado = TicketStatus.cancelled
    ticket.cancelled_at = now
    ticket.pagado_total = 0
    db.commit()
    db.refresh(ticket)
    return ticket


# =========================================================================
# Consumo (admin marca ticket como usado)
# =========================================================================

def consume_ticket_by_folio(db: Session, admin: User, folio: str) -> PrivilegeTicket:
    ticket = db.scalar(select(PrivilegeTicket).where(PrivilegeTicket.folio == folio))
    if ticket is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folio no encontrado.")
    if ticket.estado != TicketStatus.emitted:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Solo se puede consumir un ticket 'emitted'; el actual está en "
                f"'{ticket.estado.value}'."
            ),
        )
    ticket.estado = TicketStatus.consumed
    ticket.consumido_at = datetime.now(timezone.utc)
    ticket.consumido_por_admin_id = admin.id
    db.commit()
    db.refresh(ticket)
    return ticket


# =========================================================================
# Ajustes manuales del admin
# =========================================================================

def adjust_tokens(
    db: Session, admin: User, user_id: int, delta: int, nota: str
) -> TokenLedger:
    if delta == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El ajuste no puede ser 0.",
        )
    if not nota or not nota.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nota justificativa es obligatoria.",
        )
    target = db.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no existe.")

    entry = _add_ledger_entry(
        db,
        user_id=user_id,
        delta=delta,
        fuente=TokenSource.ajuste_admin,
        nota=nota.strip(),
        admin_id=admin.id,
    )
    db.commit()
    db.refresh(entry)
    return entry


# =========================================================================
# Canje de Tokens por décimas
# =========================================================================

# Conversión default 50 pts = 1 décima (§5.4). En Dominio 4 se lee de SystemState.
DEFAULT_PTS_POR_DECIMA = 50

# Flag que el profesor enciende manualmente en las últimas semanas del
# semestre (§5.4) — mismo mecanismo de SystemFlag que gatea privilegios del
# catálogo (`is_privilege_available_for_users`). Ausencia = apagado
# (safe default): sin fila en system_flags, el canje queda oculto/cerrado.
DECIMAS_FLAG_KEY = "decimas_enabled"


def request_decimal_redemption(
    db: Session,
    user: User,
    entrega_descripcion: str,
    decimas_solicitadas: int,
    entrega_ref: str | None = None,
) -> DecimalRedemptionRequest:
    # TODO(d4): verificar que semester_state == "canje_abierto".
    from app.services.system_config import get_flag  # import perezoso: evita ciclo

    if not get_flag(db, DECIMAS_FLAG_KEY):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El canje por décimas no está disponible actualmente.",
        )
    if decimas_solicitadas <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debes solicitar al menos 1 décima.",
        )
    if not entrega_descripcion.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Describe brevemente la entrega objetivo.",
        )

    pts_costo = DEFAULT_PTS_POR_DECIMA * decimas_solicitadas
    balance = get_balance(db, user.id)
    if balance < pts_costo:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Saldo insuficiente. Requieres {pts_costo} Tks, tienes {balance}.",
        )

    req = DecimalRedemptionRequest(
        user_id=user.id,
        entrega_descripcion=entrega_descripcion.strip(),
        entrega_ref=entrega_ref,
        decimas_solicitadas=decimas_solicitadas,
        pts_costo=pts_costo,
    )
    db.add(req)
    db.flush()

    # Deducción inmediata; si el profesor rechaza, se reembolsa.
    _add_ledger_entry(
        db,
        user_id=user.id,
        delta=-pts_costo,
        fuente=TokenSource.canje_decima,
        referencia_tipo="decimal_request",
        referencia_id=req.id,
        nota=f"Solicitud de {decimas_solicitadas} décima(s) para: {entrega_descripcion.strip()}",
    )
    db.commit()
    db.refresh(req)
    return req


def resolve_decimal_request(
    db: Session,
    request_id: int,
    admin: User,
    aprobar: bool,
    nota: str | None = None,
) -> DecimalRedemptionRequest:
    req = db.get(DecimalRedemptionRequest, request_id)
    if req is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Solicitud no existe.")
    if req.estado != DecimalRequestStatus.pendiente:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Solicitud en estado '{req.estado.value}', ya fue resuelta.",
        )

    now = datetime.now(timezone.utc)
    req.estado = (
        DecimalRequestStatus.aprobado if aprobar else DecimalRequestStatus.rechazado
    )
    req.resolved_at = now
    req.resolved_by = admin.id
    req.nota_profesor = nota.strip() if nota else None

    if not aprobar:
        # Reembolsar los Tks deducidos al crear la solicitud.
        _add_ledger_entry(
            db,
            user_id=req.user_id,
            delta=req.pts_costo,
            fuente=TokenSource.canje_decima,
            referencia_tipo="decimal_request",
            referencia_id=req.id,
            nota=f"Reembolso por rechazo de solicitud #{req.id}",
            admin_id=admin.id,
        )

    db.commit()
    db.refresh(req)
    return req


# =========================================================================
# Seed del catálogo por defecto (§5.2)
# =========================================================================

DEFAULT_CATALOG: list[dict] = [
    # --- Tareas y entregas ---
    {"nombre": "Pista oficial en una pregunta de tarea", "categoria": "tarea", "costo": 25,
     "limites_config": {"por_tarea": 2}},
    {"nombre": "Saltar una pregunta de tarea", "categoria": "tarea", "costo": 30,
     "limites_config": {"por_tarea": 1}},
    {"nombre": "Reintentar una pregunta calificada", "categoria": "tarea", "costo": 40,
     "limites_config": {"por_tarea": 1}},
    {"nombre": "Extensión de 24h en entrega", "categoria": "tarea", "costo": 40,
     "limites_config": {"por_semestre": 3}},
    {"nombre": "Extensión de 48h en entrega", "categoria": "tarea", "costo": 80,
     "limites_config": {"por_semestre": 2}},
    {"nombre": "Extensión de 72h en entrega", "categoria": "tarea", "costo": 150,
     "limites_config": {"por_semestre": 1}},
    {"nombre": "Saltar una tarea completa", "categoria": "tarea", "costo": 150,
     "limites_config": {"por_semestre": 2}},
    {"nombre": "Revisión previa de borrador de proyecto", "categoria": "tarea", "costo": 120,
     "limites_config": {"por_proyecto": 1}},

    # --- Exámenes parciales ---
    {"nombre": "Saltar 1 pregunta de examen parcial", "categoria": "examen", "costo": 80,
     "limites_config": {"por_examen": 2}},
    {"nombre": "Consultar 1 duda al profesor durante examen", "categoria": "examen", "costo": 60,
     "limites_config": {"por_examen": 2}},
    {"nombre": "Usar hoja de fórmulas propia en un parcial", "categoria": "examen", "costo": 100,
     "limites_config": {"por_semestre": 1}},
    {"nombre": "Reintentar un examen corto (quiz)", "categoria": "examen", "costo": 120,
     "limites_config": {"por_semestre": 1}},
    {"nombre": "Usar IA durante un examen parcial", "categoria": "examen", "costo": 380,
     "limites_config": {"por_semestre": 1}, "feature_flag_key": "ai_in_exam_enabled"},

    # --- Sustentación oral ---
    {"nombre": "Presentarse como voluntario en lugar del sorteo aleatorio",
     "categoria": "sustentacion", "costo": 50},
    {"nombre": "Ceder tu turno a un compañero voluntario del equipo",
     "categoria": "sustentacion", "costo": 90, "limites_config": {"por_semestre": 2}},
    {"nombre": "Postergar sustentación a la siguiente clase",
     "categoria": "sustentacion", "costo": 100, "limites_config": {"por_semestre": 1}},

    # --- Contenido y acceso ---
    {"nombre": "Acceso a un problema resuelto adicional del módulo",
     "categoria": "contenido", "costo": 40, "limites_config": {"por_modulo": 3}},
    {"nombre": "Adelantar acceso a un módulo 24h antes",
     "categoria": "contenido", "costo": 50, "limites_config": {"por_semestre": 2}},

    # --- Racha ---
    {"nombre": "Pase de racha adicional",
     "categoria": "racha", "costo": 30, "descripcion": "Se acumula en el inventario del alumno."},

    # --- Tutoría ---
    {"nombre": "Sesión de tutoría individual (30 min) con el profesor",
     "categoria": "tutoria", "costo": 180, "limites_config": {"por_semestre": 2}},

    # --- Asistencia ---
    {"nombre": "Retardo justificado (llegada tardía 5-15 min)",
     "categoria": "asistencia", "costo": 30, "limites_config": {"por_semestre": 3}},
    {"nombre": "Pase de asistencia (1 clase)",
     "categoria": "asistencia", "costo": 100, "limites_config": {"por_semestre": 1}},
]


def seed_default_catalog(db: Session) -> tuple[int, int]:
    """Inserta las entradas del catálogo que aún no existan (idempotente).

    Devuelve (creadas, ya_existentes).
    """
    creadas = 0
    ya_existentes = 0
    for entry in DEFAULT_CATALOG:
        existing = db.scalar(
            select(PrivilegeCatalog).where(PrivilegeCatalog.nombre == entry["nombre"])
        )
        if existing is not None:
            ya_existentes += 1
            continue
        db.add(PrivilegeCatalog(**entry))
        creadas += 1
    if creadas > 0:
        db.commit()
    return creadas, ya_existentes


# =========================================================================
# Consultas para vistas
# =========================================================================

def user_owns_or_shares_ticket(db: Session, user_id: int, ticket: PrivilegeTicket) -> bool:
    """El usuario puede ver un ticket si lo inició, aportó, o pertenece al team_id."""
    if ticket.initiator_user_id == user_id:
        return True
    if ticket.team_id and user_is_member_of_team(db, user_id, ticket.team_id):
        return True
    # También si aportó (edge case: era del equipo, ahora ya no)
    aport = db.scalar(
        select(SplitBillContribution.id).where(
            and_(
                SplitBillContribution.ticket_id == ticket.id,
                SplitBillContribution.user_id == user_id,
            )
        )
    )
    return aport is not None


def get_user_tickets(
    db: Session, user_id: int, estados: Iterable[TicketStatus] | None = None
) -> list[PrivilegeTicket]:
    """Tickets donde el usuario es iniciador o donde aportó."""
    contrib_ticket_ids = select(SplitBillContribution.ticket_id).where(
        SplitBillContribution.user_id == user_id
    )
    stmt = (
        select(PrivilegeTicket)
        .where(
            (PrivilegeTicket.initiator_user_id == user_id)
            | (PrivilegeTicket.id.in_(contrib_ticket_ids))
        )
        .options(selectinload(PrivilegeTicket.contribuciones))
        .order_by(PrivilegeTicket.created_at.desc())
    )
    if estados:
        stmt = stmt.where(PrivilegeTicket.estado.in_(list(estados)))
    return list(db.scalars(stmt).unique().all())
