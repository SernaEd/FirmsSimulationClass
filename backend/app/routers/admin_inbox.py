"""Endpoints admin del Inbox de Aprobaciones (§11.0, Dominio 4)."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_admin
from app.models.system import InboxItemStatus, InboxItemType, InboxPriority
from app.models.user import User
from app.schemas.system import DismissIn, InboxItemOut, ResolveIn, SnoozeIn
from app.services.inbox import dismiss_item, list_inbox, mark_seen_item, resolve_item, snooze_item

router = APIRouter(prefix="/admin/inbox", tags=["admin:inbox"])


@router.get("", response_model=list[InboxItemOut])
def get_inbox(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
    tipo: list[InboxItemType] | None = Query(default=None),
    prioridad: list[InboxPriority] | None = Query(default=None),
    estado: list[InboxItemStatus] | None = Query(
        default=None,
        description=(
            "Si se omite, muestra pendientes + pospuestos ya vencidos "
            "(comportamiento default del Inbox). Pasar explícito para ver histórico."
        ),
    ),
):
    return list_inbox(db, tipos=tipo, prioridades=prioridad, estados=estado)


@router.post("/{item_id}/resolve", response_model=InboxItemOut)
def resolve(
    item_id: int,
    payload: ResolveIn | None = None,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    nota = payload.nota if payload else None
    return resolve_item(db, item_id, admin, nota=nota)


@router.post("/{item_id}/snooze", response_model=InboxItemOut)
def snooze(
    item_id: int,
    payload: SnoozeIn,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return snooze_item(db, item_id, admin, until=payload.until)


@router.post("/{item_id}/dismiss", response_model=InboxItemOut)
def dismiss(
    item_id: int,
    payload: DismissIn,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return dismiss_item(db, item_id, admin, nota=payload.nota)


@router.post("/{item_id}/mark_seen", response_model=InboxItemOut)
def mark_seen(
    item_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return mark_seen_item(db, item_id, admin)
