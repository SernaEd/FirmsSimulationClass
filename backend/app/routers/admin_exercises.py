import os
import shutil
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, status, File
from sqlalchemy import select, func
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.deps import get_current_admin
from app.models.exercises import DailyExercise
from app.models.user import User
from app.schemas.exercises import DailyExerciseOut
from app.services.streak import today_mx

router = APIRouter(prefix="/admin/daily-exercises", tags=["Admin Exercises"])

UPLOAD_DIR = "uploads/exercises"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _next_numero(db: Session, course_session_id: Optional[int]) -> int:
    """Siguiente número de ejercicio disponible dentro de una clase (o de
    los ejercicios "generales", sin clase, si course_session_id es None)."""
    if course_session_id:
        stmt_max = select(func.max(DailyExercise.numero)).where(DailyExercise.course_session_id == course_session_id)
    else:
        stmt_max = select(func.max(DailyExercise.numero)).where(DailyExercise.course_session_id.is_(None))
    max_num = db.scalar(stmt_max)
    return (max_num or 0) + 1


def _save_exercise_image(imagen: UploadFile, fecha: date) -> str:
    ext = imagen.filename.split(".")[-1] if imagen.filename else "png"
    filename = f"exercise_{fecha.isoformat()}.{ext}"
    imagen_path = os.path.join(UPLOAD_DIR, filename)
    with open(imagen_path, "wb") as buffer:
        shutil.copyfileobj(imagen.file, buffer)
    return imagen_path


def _get_with_session(db: Session, exercise_id: int) -> DailyExercise:
    stmt = select(DailyExercise).options(selectinload(DailyExercise.course_session)).where(DailyExercise.id == exercise_id)
    return db.scalar(stmt)


@router.get("", response_model=list[DailyExerciseOut])
def list_exercises(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Obtiene todos los ejercicios programados."""
    stmt = select(DailyExercise).options(selectinload(DailyExercise.course_session)).order_by(DailyExercise.fecha.desc())
    return list(db.scalars(stmt).all())

@router.post("", response_model=DailyExerciseOut)
def create_exercise(
    fecha: date = Form(...),
    course_session_id: Optional[int] = Form(None),
    enunciado: str = Form(...),
    imagen: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Crea un nuevo ejercicio para un día específico."""
    # Verificar que no exista uno para la fecha
    existing = db.scalar(select(DailyExercise).where(DailyExercise.fecha == fecha))
    if existing:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Ya existe un ejercicio para esta fecha.")

    exercise = DailyExercise(
        fecha=fecha,
        course_session_id=course_session_id,
        numero=_next_numero(db, course_session_id),
        enunciado=enunciado,
        imagen_path=_save_exercise_image(imagen, fecha) if imagen else None,
    )
    db.add(exercise)
    db.commit()
    return _get_with_session(db, exercise.id)

@router.patch("/{exercise_id}", response_model=DailyExerciseOut)
def update_exercise(
    exercise_id: int,
    fecha: date = Form(...),
    course_session_id: Optional[int] = Form(None),
    enunciado: str = Form(...),
    imagen: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Edita un ejercicio programado. Solo se permite para ejercicios cuya
    fecha sea igual o posterior a hoy (los de fechas pasadas ya se
    mostraron a los alumnos y no deben modificarse)."""
    exercise = db.get(DailyExercise, exercise_id)
    if not exercise:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ejercicio no encontrado.")

    hoy = today_mx()
    if exercise.fecha < hoy:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "No se pueden editar ejercicios de fechas pasadas.")
    if fecha < hoy:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "La fecha del ejercicio no puede ser anterior a hoy.")

    if fecha != exercise.fecha:
        existing = db.scalar(
            select(DailyExercise).where(DailyExercise.fecha == fecha, DailyExercise.id != exercise_id)
        )
        if existing:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Ya existe un ejercicio para esta fecha.")

    if course_session_id != exercise.course_session_id:
        exercise.numero = _next_numero(db, course_session_id)

    exercise.fecha = fecha
    exercise.course_session_id = course_session_id
    exercise.enunciado = enunciado

    if imagen:
        if exercise.imagen_path and os.path.exists(exercise.imagen_path):
            os.remove(exercise.imagen_path)
        exercise.imagen_path = _save_exercise_image(imagen, fecha)

    db.commit()
    return _get_with_session(db, exercise.id)
