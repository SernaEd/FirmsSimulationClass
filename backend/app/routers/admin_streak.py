from fastapi import APIRouter, Depends, Path, Query, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from typing import Optional
import os

from app.database import get_db
from app.deps import get_current_admin
from app.models.streak import StreakDay, StreakEvidence, StreakDayStatus
from app.models.user import User
from app.schemas.streak import StreakEvidenceOut
from pydantic import BaseModel

router = APIRouter(prefix="/admin/streak", tags=["Admin Streak"])

@router.get("/evidence", response_model=list[StreakEvidenceOut])
def get_streak_evidence(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Obtiene las evidencias subidas para verificación puntual."""
    stmt = select(StreakEvidence).options(selectinload(StreakEvidence.user)).order_by(StreakEvidence.submitted_at.desc())
    
    if user_id:
        stmt = stmt.where(StreakEvidence.user_id == user_id)
        
    stmt = stmt.offset(skip).limit(limit)
    return list(db.scalars(stmt).all())

@router.get("/evidence/{id}/download")
def download_streak_evidence(
    evidence_id: int = Path(alias="id"),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Descarga la captura de evidencia para verificación."""
    evidence = db.get(StreakEvidence, evidence_id)
    if not evidence:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evidencia no encontrada.")

    if not os.path.exists(evidence.solucion_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Archivo no encontrado en disco.")

    return FileResponse(evidence.solucion_path)

class ResolveStreakDayIn(BaseModel):
    estado: StreakDayStatus

@router.post("/days/{id}/resolve")
def resolve_streak_day(
    payload: ResolveStreakDayIn,
    day_id: int = Path(alias="id"),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Resuelve un día pendiente de revisión a fallido o neutro."""
    day = db.get(StreakDay, day_id)
    if not day:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Día de racha no encontrado.")
        
    if payload.estado not in (StreakDayStatus.fallido, StreakDayStatus.neutro):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Solo se puede resolver a fallido o neutro.")
        
    day.estado = payload.estado
    db.commit()
    db.refresh(day)
    return day
