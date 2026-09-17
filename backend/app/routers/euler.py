"""Solver interactivo de Euler (Sesión 8 — Métodos Numéricos, §UiDesign).

Cálculo puro (ver `app.services.euler`), sin persistencia: cualquier alumno
o profesor autenticado puede simular, no hace falta ser admin."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.deps import get_current_active_user
from app.models.user import User
from app.schemas.euler import EulerModelInfo, EulerSimulateIn, EulerSimulateOut
from app.services import euler as euler_service

router = APIRouter(prefix="/tools/euler", tags=["Euler Solver"])


@router.get("/models", response_model=list[EulerModelInfo])
def list_models(user: User = Depends(get_current_active_user)):
    return euler_service.list_model_catalog()


@router.post("/simulate", response_model=EulerSimulateOut)
def simulate(payload: EulerSimulateIn, user: User = Depends(get_current_active_user)):
    try:
        return euler_service.simulate(payload)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc
