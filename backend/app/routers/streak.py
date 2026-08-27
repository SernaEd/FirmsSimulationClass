import os
import shutil
from datetime import date, datetime
from zoneinfo import ZoneInfo
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_active_user
from app.models.streak import StreakDay, StreakDayStatus, StreakEvidence
from app.models.user import User
from app.schemas.streak import StreakDayOut
from app.models.exercises import DailyExercise

router = APIRouter(prefix="/me/streak", tags=["Streak"])

UPLOAD_DIR = Path("uploads/streak")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/evidence", response_model=StreakDayOut)
async def submit_streak_evidence(
    solucion: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    """
    Sube la evidencia (solución al ejercicio del día) para la racha diaria.
    Cambia el estado a 'completado'.
    """
    today = datetime.now(ZoneInfo("America/Mexico_City")).date()

    # Buscar si hay ejercicio diario
    exercise = db.scalar(select(DailyExercise).where(DailyExercise.fecha == today))

    # Verificar si ya existe un StreakDay para hoy
    streak_day = db.scalar(
        select(StreakDay).where(
            StreakDay.user_id == user.id,
            StreakDay.fecha == today
        )
    )

    if streak_day and streak_day.evidence:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya subiste tu solución de hoy."
        )

    if not streak_day:
        streak_day = StreakDay(
            user_id=user.id,
            fecha=today,
            estado=StreakDayStatus.completado
        )
        db.add(streak_day)
        db.flush()
    else:
        streak_day.estado = StreakDayStatus.completado

    # Guardar archivo
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(solucion.filename)[1] if solucion.filename else ".png"
    safe_filename = f"{user.id}_{today.isoformat()}_{uuid4().hex[:8]}{ext}"
    file_path = UPLOAD_DIR / safe_filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(solucion.file, buffer)

    evidence = StreakEvidence(
        streak_day_id=streak_day.id,
        user_id=user.id,
        daily_exercise_id=exercise.id if exercise else None,
        solucion_path=str(file_path),
    )
    db.add(evidence)
    db.commit()
    db.refresh(streak_day)

    return streak_day

@router.get("", response_model=list[StreakDayOut])
def get_my_streak(
    year: int | None = None,
    month: int | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    """Obtiene el historial de racha del alumno."""
    stmt = select(StreakDay).where(StreakDay.user_id == user.id)
    
    if year and month:
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1)
        else:
            end_date = date(year, month + 1, 1)
        stmt = stmt.where(StreakDay.fecha >= start_date, StreakDay.fecha < end_date)
        
    stmt = stmt.order_by(StreakDay.fecha.asc())
    
    return list(db.scalars(stmt).all())
