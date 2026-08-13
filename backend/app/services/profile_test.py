"""Lógica del test de perfil de trabajo en equipo (§3, Belbin adaptado).

Se toma una sola vez, inmediatamente tras el registro, mientras la cuenta
está en `pending_profile`. El resultado no es editable por el alumno; al
enviarlo, la cuenta pasa a `pending_approval` y aparece en el Inbox de
Aprobaciones (§11.0) para que el profesor la revise, ya con el perfil
sugerido visible.
"""

from __future__ import annotations

from collections import Counter

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.profile_test import ProfileTestAnswer, ProfileTestQuestion
from app.models.system import InboxItemType, InboxPriority
from app.models.user import User, UserProfile, UserStatus
from app.schemas.profile_test import ProfileTestAnswerIn
from app.services.inbox import create_inbox_item

# Empates resueltos con esta heurística de balance (§3.4): favorece
# perfiles que tienden a escasear al formar equipos.
_TIE_BREAK_ORDER = [UserProfile.integrador, UserProfile.modelador, UserProfile.analista]


def list_questions(db: Session) -> list[ProfileTestQuestion]:
    return list(
        db.scalars(select(ProfileTestQuestion).order_by(ProfileTestQuestion.orden.asc()))
    )


def compute_profile(votes: Counter[UserProfile]) -> UserProfile:
    max_votes = max(votes.values())
    return next(perfil for perfil in _TIE_BREAK_ORDER if votes.get(perfil, 0) == max_votes)


def submit_test(db: Session, user: User, respuestas: list[ProfileTestAnswerIn]) -> User:
    # La puerta de estado (pending_profile) ya la aplica el router vía
    # `get_current_pending_profile_user` — no se repite aquí.
    all_question_ids = set(db.scalars(select(ProfileTestQuestion.id)))
    answered_ids = {r.question_id for r in respuestas}
    if answered_ids != all_question_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debes responder todas las preguntas del test, cada una una sola vez.",
        )

    for respuesta in respuestas:
        db.add(
            ProfileTestAnswer(
                user_id=user.id,
                question_id=respuesta.question_id,
                perfil_elegido=respuesta.perfil_elegido,
            )
        )

    votes = Counter(r.perfil_elegido for r in respuestas)
    perfil = compute_profile(votes)

    user.perfil = perfil
    user.estado = UserStatus.pending_approval

    create_inbox_item(
        db,
        tipo=InboxItemType.registro,
        referencia_id=user.id,
        prioridad=InboxPriority.media,
        payload={
            "nombre": user.nombre,
            "apellidos": user.apellidos,
            "numero_cuenta": user.numero_cuenta,
            "nickname": user.nickname,
            "perfil": perfil.value,
        },
    )

    db.commit()
    db.refresh(user)
    return user
