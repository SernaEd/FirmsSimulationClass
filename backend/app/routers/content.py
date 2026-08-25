"""Endpoints de Contenido para el alumno (Módulos, Sesiones, adjuntos) — Iteración 1."""

from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.deps import get_current_active_user
from app.models.content import Module
from app.models.user import User
from app.schemas.content import CourseSessionDetailOut, ModuleOut
from app.services.content import (
    get_attachment_or_404,
    get_preview_source,
    get_session_or_404,
    session_is_visible_to,
)

router = APIRouter(tags=["content"])


@router.get("/modules", response_model=list[ModuleOut])
def list_modules(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
) -> list[Module]:
    stmt = select(Module).options(selectinload(Module.sessions)).order_by(Module.numero)
    if not user.is_admin:
        stmt = stmt.where(Module.unlocked_at.isnot(None))
    return list(db.scalars(stmt).all())


@router.get("/sessions/{session_id}", response_model=CourseSessionDetailOut)
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    session = get_session_or_404(db, session_id)
    if not session_is_visible_to(user, session):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesión no existe.")
    return session


@router.get("/sessions/{session_id}/attachments/{attachment_id}/download")
def download_attachment(
    session_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
) -> FileResponse:
    attachment = get_attachment_or_404(db, attachment_id)
    if attachment.session_id != session_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Adjunto no existe.")
    if not session_is_visible_to(user, attachment.session):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Adjunto no existe.")

    path = Path(attachment.storage_path)
    if not path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="El archivo ya no está disponible.")
    return FileResponse(path, media_type=attachment.content_type, filename=attachment.filename)


@router.get("/sessions/{session_id}/attachments/{attachment_id}/preview")
def preview_attachment(
    session_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
) -> FileResponse:
    """Sirve el PDF a mostrar inline: el propio archivo si ya es PDF, o el
    PDF convertido de un PPT/PPTX — generándolo ahora mismo si hace falta
    (ver get_preview_source). Mismos chequeos de visibilidad que /download —
    es un adjunto más, no un atajo sin auth."""
    attachment = get_attachment_or_404(db, attachment_id)
    if attachment.session_id != session_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Adjunto no existe.")
    if not session_is_visible_to(user, attachment.session):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Adjunto no existe.")

    preview_source = get_preview_source(db, attachment)
    if preview_source is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Vista previa no disponible para este archivo."
        )
    return FileResponse(preview_source, media_type="application/pdf")
