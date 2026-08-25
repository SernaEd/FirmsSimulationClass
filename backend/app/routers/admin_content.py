"""Endpoints admin de Contenido (Módulos, Sesiones, adjuntos) — Iteración 1."""

from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.deps import get_current_admin
from app.models.content import CourseSession, Module
from app.models.user import User
from app.schemas.content import (
    AttachmentOut,
    CourseSessionDetailOut,
    CourseSessionIn,
    CourseSessionUpdate,
    ModuleIn,
    ModuleOut,
    ModuleUpdate,
)
from app.services.content import (
    delete_attachment,
    get_attachment_or_404,
    get_module_or_404,
    get_session_or_404,
    save_attachment,
)

router = APIRouter(prefix="/admin", tags=["admin:content"])


# ---- Módulos ----
def _check_numero_modulo_unique(db: Session, numero: int, exclude_id: int | None = None) -> None:
    stmt = select(Module).where(Module.numero == numero)
    if exclude_id is not None:
        stmt = stmt.where(Module.id != exclude_id)
    if db.scalar(stmt) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe un módulo con número {numero}.",
        )


@router.post("/modules", response_model=ModuleOut, status_code=status.HTTP_201_CREATED)
def create_module(
    payload: ModuleIn,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> Module:
    _check_numero_modulo_unique(db, payload.numero)
    module = Module(numero=payload.numero, nombre=payload.nombre)
    db.add(module)
    db.commit()
    db.refresh(module)
    return module


@router.get("/modules", response_model=list[ModuleOut])
def list_modules(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[Module]:
    return list(
        db.scalars(
            select(Module).options(selectinload(Module.sessions)).order_by(Module.numero)
        ).all()
    )


@router.patch("/modules/{module_id}", response_model=ModuleOut)
def update_module(
    module_id: int,
    payload: ModuleUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> Module:
    module = get_module_or_404(db, module_id)
    if payload.numero is not None and payload.numero != module.numero:
        _check_numero_modulo_unique(db, payload.numero, exclude_id=module_id)
        module.numero = payload.numero
    if payload.nombre is not None:
        module.nombre = payload.nombre
    db.commit()
    db.refresh(module)
    return module


@router.post("/modules/{module_id}/unlock", response_model=ModuleOut)
def unlock_module(
    module_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> Module:
    module = get_module_or_404(db, module_id)
    module.unlocked_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(module)
    return module


@router.post("/modules/{module_id}/lock", response_model=ModuleOut)
def lock_module(
    module_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> Module:
    module = get_module_or_404(db, module_id)
    module.unlocked_at = None
    db.commit()
    db.refresh(module)
    return module


# ---- Sesiones ----
def _check_numero_sesion_unique(db: Session, module_id: int, numero_sesion: int, exclude_id: int | None = None) -> None:
    stmt = select(CourseSession).where(
        CourseSession.module_id == module_id, CourseSession.numero_sesion == numero_sesion
    )
    if exclude_id is not None:
        stmt = stmt.where(CourseSession.id != exclude_id)
    if db.scalar(stmt) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"El módulo ya tiene una sesión número {numero_sesion}.",
        )


@router.post(
    "/modules/{module_id}/sessions",
    response_model=CourseSessionDetailOut,
    status_code=status.HTTP_201_CREATED,
)
def create_session(
    module_id: int,
    payload: CourseSessionIn,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> CourseSession:
    get_module_or_404(db, module_id)
    _check_numero_sesion_unique(db, module_id, payload.numero_sesion)
    session = CourseSession(
        module_id=module_id,
        numero_sesion=payload.numero_sesion,
        titulo=payload.titulo,
        descripcion=payload.descripcion,
        embed_url=payload.embed_url,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.patch("/sessions/{session_id}", response_model=CourseSessionDetailOut)
def update_session(
    session_id: int,
    payload: CourseSessionUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> CourseSession:
    session = get_session_or_404(db, session_id)
    # exclude_unset (no "is not None"): descripcion es nullable a propósito
    # — un PATCH que la manda en null explícito debe poder limpiarla, y eso
    # es indistinguible de "no se mandó" si solo se chequea `is not None`.
    # titulo/numero_sesion NO son nullable en BD — a diferencia de
    # descripcion, un null explícito ahí es inválido, no "bórralo".
    data = payload.model_dump(exclude_unset=True)
    if data.get("titulo") is None and "titulo" in data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El título no puede ser nulo.")
    if data.get("numero_sesion") is None and "numero_sesion" in data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="El número de sesión no puede ser nulo."
        )
    if "numero_sesion" in data and data["numero_sesion"] != session.numero_sesion:
        _check_numero_sesion_unique(db, session.module_id, data["numero_sesion"], exclude_id=session.id)
    for key, value in data.items():
        setattr(session, key, value)
    db.commit()
    db.refresh(session)
    return session


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> None:
    session = get_session_or_404(db, session_id)
    # Las rutas se capturan antes del commit (después, el objeto expira y
    # ya no hay fila que releer). El borrado en disco va DESPUÉS de
    # confirmar la transacción: si el commit falla, no queremos haber
    # borrado ya archivos que la fila (todavía viva) sigue referenciando.
    # Las filas de adjuntos las limpia el cascade="all, delete-orphan" de
    # CourseSession.attachments al borrar la sesión, sin necesidad de un
    # DELETE + commit por adjunto.
    attachment_paths = [attachment.storage_path for attachment in session.attachments]
    preview_paths = [
        attachment.preview_path for attachment in session.attachments if attachment.preview_path
    ]
    db.delete(session)
    db.commit()
    for storage_path in attachment_paths:
        Path(storage_path).unlink(missing_ok=True)
    for preview_path in preview_paths:
        Path(preview_path).unlink(missing_ok=True)


# ---- Adjuntos ----
@router.post(
    "/sessions/{session_id}/attachments",
    response_model=AttachmentOut,
    status_code=status.HTTP_201_CREATED,
)
def upload_attachment(
    session_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    session = get_session_or_404(db, session_id)
    return save_attachment(db, session, file)


@router.delete("/attachments/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> None:
    attachment = get_attachment_or_404(db, attachment_id)
    delete_attachment(db, attachment)
