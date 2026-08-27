"""Admin del calendario académico (§11.5, §16.5): catálogo de tipos de
evento + los eventos mismos (exámenes, entregas, licitaciones, descansos
obligatorios, excepciones personales...).
"""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.deps import get_current_admin
from app.models.calendar import CalendarEvent, CalendarEventScope, CalendarEventType
from app.models.user import User
from app.schemas.calendar import (
    CalendarEventCreate,
    CalendarEventOut,
    CalendarEventTypeCreate,
    CalendarEventTypeOut,
    CalendarEventTypeUpdate,
    CalendarEventUpdate,
    normalize_alcance,
)
from app.services.streak import recompute_neutral_for_existing, recompute_neutral_for_type, today_mx

router = APIRouter(prefix="/admin/calendar", tags=["admin:calendar"])


# ---------------------------------------------------------------------------
# Catálogo de tipos de evento
# ---------------------------------------------------------------------------


@router.get("/event-types", response_model=list[CalendarEventTypeOut])
def list_event_types(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    return list(db.scalars(select(CalendarEventType).order_by(CalendarEventType.nombre)).all())


@router.post("/event-types", response_model=CalendarEventTypeOut, status_code=status.HTTP_201_CREATED)
def create_event_type(
    payload: CalendarEventTypeCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    existing = db.scalar(select(CalendarEventType).where(CalendarEventType.nombre == payload.nombre))
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe un tipo de evento llamado '{payload.nombre}'.",
        )
    entry = CalendarEventType(**payload.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.patch("/event-types/{type_id}", response_model=CalendarEventTypeOut)
def update_event_type(
    type_id: int,
    payload: CalendarEventTypeUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    entry = db.get(CalendarEventType, type_id)
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tipo de evento no existe.")
    data = payload.model_dump(exclude_unset=True)
    if "nombre" in data and data["nombre"] != entry.nombre:
        dup = db.scalar(select(CalendarEventType).where(CalendarEventType.nombre == data["nombre"]))
        if dup is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Ya existe un tipo de evento llamado '{data['nombre']}'.",
            )
    for key, value in data.items():
        setattr(entry, key, value)
    db.commit()
    db.refresh(entry)

    # `is_racha_day` hace join en vivo contra `afecta_racha`: activarla aquí
    # cambia retroactivamente el veredicto para TODAS las fechas pasadas con
    # un evento `alcance=todos` de este tipo, no solo la más reciente -- a
    # diferencia de `create_event`, que solo recalcula una fecha a la vez.
    if data.get("afecta_racha") is True:
        recompute_neutral_for_type(db, entry.id)

    return entry


@router.delete("/event-types/{type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event_type(
    type_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    entry = db.get(CalendarEventType, type_id)
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tipo de evento no existe.")
    # Chequeo suave (mismo patrón que /admin/privileges): si tiene eventos
    # asociados, mejor bloquear que dejar filas huérfanas.
    has_events = db.scalar(select(CalendarEvent.id).where(CalendarEvent.tipo_id == type_id).limit(1))
    if has_events is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se puede eliminar: hay eventos que usan este tipo. Edítalo en vez de borrarlo.",
        )
    db.delete(entry)
    db.commit()


# ---------------------------------------------------------------------------
# Eventos
# ---------------------------------------------------------------------------


@router.get("/events", response_model=list[CalendarEventOut])
def list_events(
    start: date = Query(..., description="Fecha inicial, inclusive"),
    end: date = Query(..., description="Fecha final, inclusive"),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    stmt = (
        select(CalendarEvent)
        .options(selectinload(CalendarEvent.tipo))
        .where(CalendarEvent.fecha >= start, CalendarEvent.fecha <= end)
        .order_by(CalendarEvent.fecha)
    )
    return list(db.scalars(stmt).all())


@router.post("/events", response_model=CalendarEventOut, status_code=status.HTTP_201_CREATED)
def create_event(
    payload: CalendarEventCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    tipo = db.get(CalendarEventType, payload.tipo_id)
    if tipo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tipo de evento no existe.")

    event = CalendarEvent(**payload.model_dump(), created_by=admin.id)
    db.add(event)
    db.commit()
    db.refresh(event)

    # Marcado retroactivo (§16.5): si el evento es de alcance general, su
    # categoría afecta la racha, y la fecha ya pasó, el job nocturno ya pudo
    # haber evaluado a los alumnos activos -- recalcula esas filas a
    # `neutro` en vez de esperar a que alguien lo note manualmente.
    if tipo.afecta_racha and event.alcance_tipo == CalendarEventScope.todos and event.fecha <= today_mx():
        recompute_neutral_for_existing(db, event.fecha)

    db.refresh(event, attribute_names=["tipo"])
    return event


@router.patch("/events/{event_id}", response_model=CalendarEventOut)
def update_event(
    event_id: int,
    payload: CalendarEventUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    event = db.get(CalendarEvent, event_id)
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento no encontrado.")

    data = payload.model_dump(exclude_unset=True)
    if "tipo_id" in data and db.get(CalendarEventType, data["tipo_id"]) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tipo de evento no existe.")
    # Solo re-valida el alcance si el PATCH toca alguno de los dos campos --
    # un cambio parcial (ej. solo el título) no debe recalcular nada. Usa el
    # valor ya guardado del campo que no vino en el payload, para cubrir
    # "agregar un alumno más" a un evento que ya era alcance=alumno.
    if "alcance_tipo" in data or "alcance_ids" in data:
        effective_tipo = data.get("alcance_tipo", event.alcance_tipo)
        effective_ids = data.get("alcance_ids", event.alcance_ids)
        try:
            data["alcance_ids"] = normalize_alcance(effective_tipo, effective_ids)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    for key, value in data.items():
        setattr(event, key, value)
    db.commit()
    db.refresh(event, attribute_names=["tipo"])

    # Mismo criterio que create_event, aplicado al estado FINAL del evento
    # (ya con el patch encima) -- cubre corregir la fecha, el tipo o el
    # alcance de un evento existente, no solo crear uno nuevo. Si el patch
    # movió la fecha o el alcance, la fecha/alumnos anteriores no se
    # revierten (mismo motivo que delete_event: no hay forma confiable de
    # distinguir "neutro por este evento" de "neutro por otra razón").
    if event.tipo.afecta_racha and event.alcance_tipo == CalendarEventScope.todos and event.fecha <= today_mx():
        recompute_neutral_for_existing(db, event.fecha)

    return event


@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    # Nota: a diferencia de `create_event`, esto NO revierte el recálculo
    # retroactivo -- si la fecha ya pasó y ya se habían pasado filas a
    # `neutro` por este evento, borrarlo aquí las deja en `neutro`. No hay
    # forma confiable de distinguir "neutro por este evento" de "neutro por
    # otra razón" para revertir solo lo correcto. Corrección manual: el
    # spot-check de `/admin/racha` (POST /admin/streak/days/{id}/resolve).
    event = db.get(CalendarEvent, event_id)
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento no encontrado.")
    db.delete(event)
    db.commit()
