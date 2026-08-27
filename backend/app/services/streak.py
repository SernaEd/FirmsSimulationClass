"""Lógica de negocio de la racha diaria compartida entre el job nocturno
(`services/scheduler.py`) y el calendario académico editable (§11.5).

`is_racha_day` centraliza la regla de qué días cuentan para la racha
(lunes-jueves, §5.5) y cuáles son neutros por diseño o por un evento
`alcance=todos` cuya categoría (`CalendarEventType.afecta_racha`) lo marque
así -- un solo lugar para no repetir el check de weekday+calendario en cada
consumidor.
"""

from __future__ import annotations

from datetime import date, datetime
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.calendar import CalendarEvent, CalendarEventScope, CalendarEventType
from app.models.streak import StreakDay, StreakDayStatus
from app.models.user import User, UserStatus


def today_mx() -> date:
    """Fecha de "hoy" en America/Mexico_City -- mismo criterio que ya usan
    `routers/streak.py` y `routers/exercises.py` para decidir a qué fecha
    pertenece un envío del alumno."""
    return datetime.now(ZoneInfo("America/Mexico_City")).date()


def is_racha_day(db: Session, fecha: date) -> bool:
    """True si `fecha` cuenta para la racha (puede romperla/hacerla crecer).

    Viernes-domingo son neutros por diseño (§5.5, `isoweekday()` 5/6/7);
    cualquier otro día con un evento `alcance=todos` cuya categoría tenga
    `afecta_racha=True` (ej. "Descanso obligatorio") también es neutro. Un
    evento personal (`alcance=alumno`, ej. examen reprogramado) nunca entra
    aquí -- es informativo, no afecta la racha de nadie.
    """
    if fecha.isoweekday() >= 5:
        return False
    holiday = db.scalar(
        select(CalendarEvent.id)
        .join(CalendarEventType, CalendarEvent.tipo_id == CalendarEventType.id)
        .where(
            CalendarEvent.fecha == fecha,
            CalendarEvent.alcance_tipo == CalendarEventScope.todos,
            CalendarEventType.afecta_racha.is_(True),
        )
        .limit(1)
    )
    return holiday is None


def mark_neutral_for_active_users(db: Session, fecha: date) -> int:
    """Asegura un `StreakDay` en `neutro` para cada alumno activo en `fecha`.

    No pisa `completado`/`pase_aplicado` -- un envío real o un pase ya
    aplicado no se invalida porque el día resulte no contar para la racha.
    Usado por el job nocturno para el día evaluado ("ayer") cuando
    `is_racha_day` da False. Devuelve cuántos alumnos se marcaron/actualizaron.
    """
    active_users = db.scalars(select(User).where(User.estado == UserStatus.active)).all()
    affected = 0
    for user in active_users:
        streak_day = db.scalar(
            select(StreakDay).where(StreakDay.user_id == user.id, StreakDay.fecha == fecha)
        )
        if streak_day is None:
            db.add(StreakDay(user_id=user.id, fecha=fecha, estado=StreakDayStatus.neutro))
            affected += 1
        elif streak_day.estado not in (StreakDayStatus.completado, StreakDayStatus.pase_aplicado):
            streak_day.estado = StreakDayStatus.neutro
            affected += 1
    db.commit()
    return affected


def recompute_neutral_for_existing(db: Session, fecha: date) -> int:
    """Pasa a `neutro` los `StreakDay` ya evaluados en `fecha` que quedaron
    `fallido`/`pendiente_revision` -- caso del profesor marcando un festivo
    retroactivamente (§16.5), cuando el job nocturno ya corrió para ese día
    y ya existe una fila por alumno. No crea filas nuevas (a diferencia de
    `mark_neutral_for_active_users`): si nadie fue evaluado ese día todavía,
    no hay nada que recalcular -- el job nocturno lo tomará en cuenta cuando
    le toque. Devuelve cuántas filas se actualizaron.
    """
    rows = db.scalars(
        select(StreakDay).where(
            StreakDay.fecha == fecha,
            StreakDay.estado.in_([StreakDayStatus.fallido, StreakDayStatus.pendiente_revision]),
        )
    ).all()
    for row in rows:
        row.estado = StreakDayStatus.neutro
    db.commit()
    return len(rows)


def recompute_neutral_for_type(db: Session, tipo_id: int) -> int:
    """Igual que `recompute_neutral_for_existing`, pero para TODAS las fechas
    pasadas con un evento `alcance=todos` de esta categoría.

    `is_racha_day` hace un join en vivo contra `CalendarEventType.afecta_racha`
    -- si un admin activa esa casilla en un tipo que ya tenía eventos creados
    (ej. se le olvidó marcarla al crear "Descanso obligatorio" y ya hay tres
    fechas con ese evento), el efecto es retroactivo para todas esas fechas a
    la vez, no solo la más reciente. `admin_calendar.py::update_event_type`
    llama esto cuando `afecta_racha` pasa a `True`.

    No hace nada si `afecta_racha` se apaga -- mismo criterio que
    `admin_calendar.py::delete_event`: no hay forma confiable de distinguir
    "neutro por este tipo" de "neutro por otra razón" para revertir solo lo
    correcto. Devuelve cuántas filas de `StreakDay` se actualizaron en total.
    """
    fechas = db.scalars(
        select(CalendarEvent.fecha)
        .where(
            CalendarEvent.tipo_id == tipo_id,
            CalendarEvent.alcance_tipo == CalendarEventScope.todos,
            CalendarEvent.fecha <= today_mx(),
        )
        .distinct()
    ).all()
    return sum(recompute_neutral_for_existing(db, fecha) for fecha in fechas)
