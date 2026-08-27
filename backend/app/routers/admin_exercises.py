import os
import shutil
from datetime import date
from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, status, File
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.deps import get_current_admin
from app.models.exercises import DailyExercise
from app.models.user import User
from app.schemas.exercises import DailyExerciseOut

router = APIRouter(prefix="/admin/daily-exercises", tags=["Admin Exercises"])

UPLOAD_DIR = "uploads/exercises"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("", response_model=list[DailyExerciseOut])
def list_exercises(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Obtiene todos los ejercicios programados."""
    stmt = select(DailyExercise).options(selectinload(DailyExercise.course_session)).order_by(DailyExercise.fecha.desc())
    return list(db.scalars(stmt).all())

@router.post("", response_model=DailyExerciseOut)
def create_exercise(
    fecha: date = Form(...),
    course_session_id: int | None = Form(None),
    numero: int = Form(...),
    enunciado: str = Form(...),
    imagen: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Crea un nuevo ejercicio para un día específico."""
    # Verificar que no exista uno para la fecha
    existing = db.scalar(select(DailyExercise).where(DailyExercise.fecha == fecha))
    if existing:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Ya existe un ejercicio para esta fecha.")

    imagen_path = None
    if imagen:
        ext = imagen.filename.split(".")[-1] if imagen.filename else "png"
        filename = f"exercise_{fecha.isoformat()}.{ext}"
        imagen_path = os.path.join(UPLOAD_DIR, filename)
        with open(imagen_path, "wb") as buffer:
            shutil.copyfileobj(imagen.file, buffer)

    exercise = DailyExercise(
        fecha=fecha,
        course_session_id=course_session_id,
        numero=numero,
        enunciado=enunciado,
        imagen_path=imagen_path
    )
    db.add(exercise)
    db.commit()
    db.refresh(exercise)
    # Refrescar con la relación cargada
    stmt = select(DailyExercise).options(selectinload(DailyExercise.course_session)).where(DailyExercise.id == exercise.id)
    return db.scalar(stmt)
