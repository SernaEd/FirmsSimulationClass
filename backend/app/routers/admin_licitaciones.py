"""Endpoints admin de Licitaciones (§10) — gestión del banco de casos y
apertura/cierre de licitaciones.

No incluye todavía una pantalla de administración en el frontend (ver PR
description): por ahora se opera desde /docs. El profesor abre una
licitación al inicio de la sesión y la cierra al terminar la fase de
resolución; `cerrar_licitacion` calcula el podio y acredita Tokens.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.deps import get_current_admin
from app.models.licitaciones import Caso, Licitacion, LicitacionResponse
from app.models.user import User
from app.schemas.licitaciones import (
    CasoIn,
    CasoOut,
    CasoUpdate,
    LicitacionAbrirIn,
    LicitacionOut,
    LicitacionResponseOut,
)
from app.services.licitaciones import abrir_licitacion, cerrar_licitacion, get_caso_or_404

router = APIRouter(prefix="/admin", tags=["admin:licitaciones"])


# ---------------------------------------------------------------------------
# Casos
# ---------------------------------------------------------------------------

def _check_numero_caso_unique(db: Session, numero: int, exclude_id: int | None = None) -> None:
    stmt = select(Caso).where(Caso.numero == numero)
    if exclude_id is not None:
        stmt = stmt.where(Caso.id != exclude_id)
    if db.scalar(stmt) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe un caso con número {numero}.",
        )


@router.get("/casos", response_model=list[CasoOut])
def admin_list_casos(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[Caso]:
    return list(db.scalars(select(Caso).order_by(Caso.numero)).all())


@router.post("/casos", response_model=CasoOut, status_code=status.HTTP_201_CREATED)
def admin_create_caso(
    payload: CasoIn,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> Caso:
    _check_numero_caso_unique(db, payload.numero)
    caso = Caso(**payload.model_dump())
    db.add(caso)
    db.commit()
    db.refresh(caso)
    return caso


@router.patch("/casos/{caso_id}", response_model=CasoOut)
def admin_update_caso(
    caso_id: int,
    payload: CasoUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> Caso:
    caso = get_caso_or_404(db, caso_id)
    data = payload.model_dump(exclude_unset=True)
    if "numero" in data and data["numero"] != caso.numero:
        _check_numero_caso_unique(db, data["numero"], exclude_id=caso_id)
    for key, value in data.items():
        setattr(caso, key, value)
    db.commit()
    db.refresh(caso)
    return caso


# ---------------------------------------------------------------------------
# Licitaciones
# ---------------------------------------------------------------------------

@router.get("/licitaciones", response_model=list[LicitacionOut])
def admin_list_licitaciones(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[Licitacion]:
    return list(
        db.scalars(
            select(Licitacion)
            .options(selectinload(Licitacion.caso))
            .order_by(Licitacion.abierta_at.desc())
        ).all()
    )


@router.post("/licitaciones/abrir", response_model=LicitacionOut, status_code=status.HTTP_201_CREATED)
def admin_abrir_licitacion(
    payload: LicitacionAbrirIn,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> Licitacion:
    return abrir_licitacion(
        db,
        admin,
        payload.caso_id,
        pts_primero=payload.pts_primero,
        pts_segundo=payload.pts_segundo,
        pts_tercero=payload.pts_tercero,
        pts_correcta_fuera_podio=payload.pts_correcta_fuera_podio,
        pts_participacion=payload.pts_participacion,
    )


@router.post("/licitaciones/{licitacion_id}/cerrar", response_model=LicitacionOut)
def admin_cerrar_licitacion(
    licitacion_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> Licitacion:
    return cerrar_licitacion(db, licitacion_id)


@router.get("/licitaciones/{licitacion_id}/respuestas", response_model=list[LicitacionResponseOut])
def admin_list_respuestas(
    licitacion_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[LicitacionResponse]:
    return list(
        db.scalars(
            select(LicitacionResponse)
            .where(LicitacionResponse.licitacion_id == licitacion_id)
            .order_by(LicitacionResponse.created_at.asc())
        ).all()
    )
