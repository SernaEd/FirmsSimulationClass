"""Calendario académico, vista de alumno (§11.5): solo lectura. Eventos de
alcance `todos` + los eventos personales dirigidos a este alumno."""

from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.deps import get_current_active_user
from app.models.calendar import CalendarEvent, CalendarEventScope
from app.models.user import User
from app.schemas.calendar import CalendarEventOut

router = APIRouter(prefix="/calendar", tags=["Calendar"])


@router.get("/events", response_model=list[CalendarEventOut])
def list_my_calendar_events(
    start: date = Query(..., description="Fecha inicial, inclusive"),
    end: date = Query(..., description="Fecha final, inclusive"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    stmt = (
        select(CalendarEvent)
        .options(selectinload(CalendarEvent.tipo))
        .where(CalendarEvent.fecha >= start, CalendarEvent.fecha <= end)
        .order_by(CalendarEvent.fecha)
    )
    events = db.scalars(stmt).all()
    # Filtro en Python, no en SQL: `alcance_ids` es una lista JSON y el
    # volumen por rango (una semana/mes) es chico -- no vale la pena una
    # consulta JSON_CONTAINS específica de MySQL por esto.
    return [
        e
        for e in events
        if e.alcance_tipo == CalendarEventScope.todos
        or (e.alcance_ids is not None and user.id in e.alcance_ids)
    ]
