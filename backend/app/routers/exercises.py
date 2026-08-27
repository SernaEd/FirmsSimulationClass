from datetime import datetime
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.deps import get_current_active_user
from app.models.exercises import DailyExercise
from app.models.user import User
from app.schemas.exercises import DailyExerciseOut
from fastapi.responses import FileResponse
import os

router = APIRouter(prefix="/daily-exercises", tags=["Exercises"])

@router.get("/today", response_model=DailyExerciseOut | None)
def get_today_exercise(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    """Obtiene el ejercicio del día actual, si existe."""
    today = datetime.now(ZoneInfo("America/Mexico_City")).date()
    stmt = select(DailyExercise).options(selectinload(DailyExercise.course_session)).where(DailyExercise.fecha == today)
    exercise = db.scalar(stmt)
    return exercise

@router.get("/{id}/image")
def get_exercise_image(
    id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    """Devuelve la imagen del ejercicio."""
    exercise = db.get(DailyExercise, id)
    if not exercise or not exercise.imagen_path:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Imagen no encontrada.")
    if not os.path.exists(exercise.imagen_path):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Archivo no encontrado en el servidor.")
    return FileResponse(exercise.imagen_path)
