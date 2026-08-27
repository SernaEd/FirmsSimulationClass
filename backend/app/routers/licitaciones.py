"""Endpoints de Licitaciones para el alumno (§10)."""

from typing import Optional

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_active_user
from app.models.licitaciones import Licitacion, LicitacionResponse
from app.models.user import User
from app.schemas.licitaciones import LicitacionOut, LicitacionResponseIn, LicitacionResponseOut
from app.services.licitaciones import (
    assert_licitacion_existe,
    enviar_respuesta,
    get_licitacion_abierta,
    get_licitacion_or_404,
    get_mi_respuesta,
)

router = APIRouter(tags=["licitaciones"])


@router.get("/licitaciones/activa", response_model=Optional[LicitacionOut])
def licitacion_activa(
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_active_user),
) -> Optional[Licitacion]:
    return get_licitacion_abierta(db)


@router.get("/licitaciones/{licitacion_id}", response_model=LicitacionOut)
def get_licitacion(
    licitacion_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_active_user),
) -> Licitacion:
    return get_licitacion_or_404(db, licitacion_id)


@router.post(
    "/licitaciones/{licitacion_id}/responder",
    response_model=LicitacionResponseOut,
    status_code=status.HTTP_201_CREATED,
)
def responder_licitacion(
    licitacion_id: int,
    payload: LicitacionResponseIn,
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> LicitacionResponse:
    return enviar_respuesta(db, user, licitacion_id, payload.q)


@router.get("/licitaciones/{licitacion_id}/mi-respuesta", response_model=Optional[LicitacionResponseOut])
def mi_respuesta(
    licitacion_id: int,
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Optional[LicitacionResponse]:
    assert_licitacion_existe(db, licitacion_id)
    return get_mi_respuesta(db, user, licitacion_id)
