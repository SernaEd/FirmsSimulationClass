"""Lógica de negocio del Inbox de Aprobaciones (§11.0, Dominio 4).

`create_inbox_item` y `resolve_inbox_items` están pensadas para llamarse
como *hooks* desde los routers de otros dominios (registro de usuario,
propuesta de nombre de firma, etc.) para que el Inbox se mantenga en
sincronía sin importar si el profesor actúa desde la vista específica
(`/admin/users/pending`) o desde el Inbox unificado.
"""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from app.models.system import InboxItem, InboxItemStatus, InboxItemType, InboxPriority
from app.models.user import User


# ---------------------------------------------------------------------------
# Hooks de creación / resolución (llamados desde otros dominios)
# ---------------------------------------------------------------------------

def create_inbox_item(
    db: Session,
    tipo: InboxItemType,
    referencia_id: int | None,
    prioridad: InboxPriority = InboxPriority.media,
    payload: dict | None = None,
) -> InboxItem:
    item = InboxItem(
        tipo=tipo,
        referencia_id=referencia_id,
        prioridad=prioridad,
        payload_json=payload,
        estado=InboxItemStatus.pendiente,
    )
    db.add(item)
    db.flush()
    return item


def resolve_inbox_items(
    db: Session,
    tipo: InboxItemType,
    referencia_id: int,
    admin_id: int | None = None,
    nota: str | None = None,
) -> int:
    """Marca como `atendido` todos los items pendientes/pospuestos que
    apunten a esta referencia. Se usa cuando la acción real ocurrió por
    fuera del Inbox (ej. aprobar desde /admin/users/pending). Devuelve
    cuántos items se resolvieron (0 si no había ninguno -- no es error).
    """
    now = datetime.now(timezone.utc)
    items = db.scalars(
        select(InboxItem).where(
            InboxItem.tipo == tipo,
            InboxItem.referencia_id == referencia_id,
            InboxItem.estado.in_([InboxItemStatus.pendiente, InboxItemStatus.pospuesto]),
        )
    ).all()
    for item in items:
        item.estado = InboxItemStatus.atendido
        item.resuelto_at = now
        item.resuelto_por = admin_id
        item.nota_resolucion = nota
    return len(items)


# ---------------------------------------------------------------------------
# Listado
# ---------------------------------------------------------------------------

def list_inbox(
    db: Session,
    tipos: list[InboxItemType] | None = None,
    prioridades: list[InboxPriority] | None = None,
    estados: list[InboxItemStatus] | None = None,
) -> list[InboxItem]:
    """Por defecto muestra 'pendiente' + 'pospuesto' cuyo snooze ya venció
    (vuelven a aparecer automáticamente, sin necesidad de un job). Si se
    pasa `estados` explícito, se respeta tal cual (para ver histórico).
    """
    now = datetime.now(timezone.utc)

    if estados:
        stmt = select(InboxItem).where(InboxItem.estado.in_(estados))
    else:
        stmt = select(InboxItem).where(
            or_(
                InboxItem.estado == InboxItemStatus.pendiente,
                and_(
                    InboxItem.estado == InboxItemStatus.pospuesto,
                    InboxItem.snoozed_until.isnot(None),
                    InboxItem.snoozed_until <= now,
                ),
            )
        )

    if tipos:
        stmt = stmt.where(InboxItem.tipo.in_(tipos))
    if prioridades:
        stmt = stmt.where(InboxItem.prioridad.in_(prioridades))

    # Prioridad alta primero, luego antigüedad (más viejo primero).
    priority_order = {InboxPriority.alta: 0, InboxPriority.media: 1, InboxPriority.baja: 2}
    items = list(db.scalars(stmt).all())
    items.sort(key=lambda i: (priority_order.get(i.prioridad, 9), i.created_at))
    return items


# ---------------------------------------------------------------------------
# Acciones genéricas (resolve / snooze / dismiss / mark_seen)
# ---------------------------------------------------------------------------

def _get_item_or_404(db: Session, item_id: int) -> InboxItem:
    item = db.get(InboxItem, item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item de inbox no existe.")
    return item


def resolve_item(db: Session, item_id: int, admin: User, nota: str | None = None) -> InboxItem:
    item = _get_item_or_404(db, item_id)
    item.estado = InboxItemStatus.atendido
    item.resuelto_at = datetime.now(timezone.utc)
    item.resuelto_por = admin.id
    item.nota_resolucion = nota
    db.commit()
    db.refresh(item)
    return item


def snooze_item(db: Session, item_id: int, admin: User, until: datetime) -> InboxItem:
    if until <= datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La fecha de posposición debe ser futura.",
        )
    item = _get_item_or_404(db, item_id)
    item.estado = InboxItemStatus.pospuesto
    item.snoozed_until = until
    db.commit()
    db.refresh(item)
    return item


def dismiss_item(db: Session, item_id: int, admin: User, nota: str) -> InboxItem:
    if not nota or not nota.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Descartar un item requiere una nota explicando el motivo.",
        )
    item = _get_item_or_404(db, item_id)
    item.estado = InboxItemStatus.descartado
    item.resuelto_at = datetime.now(timezone.utc)
    item.resuelto_por = admin.id
    item.nota_resolucion = nota.strip()
    db.commit()
    db.refresh(item)
    return item


def mark_seen_item(db: Session, item_id: int, admin: User) -> InboxItem:
    item = _get_item_or_404(db, item_id)
    item.estado = InboxItemStatus.visto
    item.resuelto_at = datetime.now(timezone.utc)
    item.resuelto_por = admin.id
    db.commit()
    db.refresh(item)
    return item
