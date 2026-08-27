"""Admin del calendario académico editable (§11.5, §16.5).

Alcance del MVP: marcar/desmarcar días festivos o sin clase para que la
racha diaria los trate como neutros -- no la "vista mensual y semestral"
completa que describe el plan original, que no tiene un consumidor todavía.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_admin
from app.models.calendar import AcademicCalendarDay
from app.models.user import User
from app.schemas.calendar import AcademicCalendarDayCreate, AcademicCalendarDayOut
from app.services.streak import recompute_neutral_for_existing, today_mx

router = APIRouter(prefix="/admin/calendar", tags=["admin:calendar"])


@router.get("/holidays", response_model=list[AcademicCalendarDayOut])
def list_holidays(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    stmt = select(AcademicCalendarDay).order_by(AcademicCalendarDay.fecha)
    return list(db.scalars(stmt).all())


@router.post("/holidays", response_model=AcademicCalendarDayOut, status_code=status.HTTP_201_CREATED)
def create_holiday(
    payload: AcademicCalendarDayCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    existing = db.scalar(select(AcademicCalendarDay).where(AcademicCalendarDay.fecha == payload.fecha))
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Esa fecha ya está marcada en el calendario académico.",
        )

    day = AcademicCalendarDay(fecha=payload.fecha, motivo=payload.motivo, created_by=admin.id)
    db.add(day)
    db.commit()
    db.refresh(day)

    # Marcado retroactivo (§16.5): si el día ya pasó, el job nocturno ya
    # pudo haber evaluado a los alumnos activos -- recalcula esas filas a
    # `neutro` en vez de esperar a que alguien lo note manualmente.
    if payload.fecha <= today_mx():
        recompute_neutral_for_existing(db, payload.fecha)

    return day


@router.delete("/holidays/{holiday_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_holiday(
    holiday_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    # Nota: a diferencia de `create_holiday`, esto NO revierte el recálculo
    # retroactivo -- si el día ya pasó y ya se habían pasado filas a
    # `neutro` por este festivo, quitarlo aquí las deja en `neutro`. No hay
    # forma confiable de distinguir "neutro por este festivo" de "neutro por
    # otra razón" para revertir solo lo correcto. Corrección manual: el
    # spot-check de `/admin/racha` (POST /admin/streak/days/{id}/resolve).
    day = db.get(AcademicCalendarDay, holiday_id)
    if day is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Día no encontrado en el calendario.")
    db.delete(day)
    db.commit()
