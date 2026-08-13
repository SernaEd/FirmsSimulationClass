"""Endpoints del test de perfil de trabajo en equipo (§3, Iteración 1)."""

import random

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_pending_profile_user
from app.models.profile_test import ProfileTestQuestion
from app.models.user import User
from app.schemas.auth import UserOut
from app.schemas.profile_test import ProfileTestOptionOut, ProfileTestQuestionOut, ProfileTestSubmitIn
from app.services.profile_test import list_questions, submit_test

router = APIRouter(prefix="/profile-test", tags=["profile-test"])


def _question_to_out(question: ProfileTestQuestion) -> ProfileTestQuestionOut:
    # Orden aleatorio por petición (§3.4): evita que la posición de la
    # opción delate el perfil (ej. "siempre la de en medio es modelador") y
    # dificulta que alumnos comparen respuestas por posición.
    opciones = [
        ProfileTestOptionOut(perfil="analista", texto=question.opcion_analista),
        ProfileTestOptionOut(perfil="modelador", texto=question.opcion_modelador),
        ProfileTestOptionOut(perfil="integrador", texto=question.opcion_integrador),
    ]
    random.shuffle(opciones)
    return ProfileTestQuestionOut(
        id=question.id,
        orden=question.orden,
        enunciado=question.enunciado,
        opciones=opciones,
    )


@router.get("", response_model=list[ProfileTestQuestionOut])
def get_profile_test(
    _user: User = Depends(get_current_pending_profile_user),
    db: Session = Depends(get_db),
) -> list[ProfileTestQuestionOut]:
    return [_question_to_out(q) for q in list_questions(db)]


@router.post("/submit", response_model=UserOut)
def submit_profile_test(
    payload: ProfileTestSubmitIn,
    user: User = Depends(get_current_pending_profile_user),
    db: Session = Depends(get_db),
) -> User:
    return submit_test(db, user, payload.respuestas)
