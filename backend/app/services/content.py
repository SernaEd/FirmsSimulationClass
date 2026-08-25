"""Lógica de negocio de Contenido (Módulos, Sesiones, adjuntos) — Iteración 1.

El admin edita las sesiones directo en la plataforma (título + descripción)
y sube sus propios archivos de clase (PDF/PPTX/Word/imágenes) en vez de
sincronizar desde una fuente externa. Los adjuntos se guardan en disco bajo
`UPLOAD_ROOT` (montado como volumen Docker, ver docker-compose.yml) y solo
se sirven vía el endpoint de descarga autenticado — nunca como estático
público — para respetar el mismo modelo de acceso que el resto del app
(§`session_is_visible_to`: un módulo bloqueado no debe filtrar su contenido
ni por URL directa de un adjunto).
"""

from __future__ import annotations

import logging
import re
import subprocess
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.config import settings
from app.models.content import CourseSession, Module, SessionAttachment
from app.models.user import User

logger = logging.getLogger(__name__)

# Resuelto a absoluta al importar (no relativa al cwd del proceso que la
# lea después) — `storage_path` se guarda en BD tal cual, y un cwd distinto
# en un futuro script/deploy no debe volverla irresoluble.
UPLOAD_ROOT = (Path("uploads") / "sessions").resolve()

# Extensión -> content-type esperado. Se valida por extensión (más confiable
# que el content-type que manda el navegador, que a veces llega genérico
# como application/octet-stream) y se guarda el content-type real solo para
# la respuesta de descarga.
ALLOWED_EXTENSIONS: dict[str, str] = {
    ".pdf": "application/pdf",
    ".ppt": "application/vnd.ms-powerpoint",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
}

_UNSAFE_CHARS = re.compile(r"[^A-Za-z0-9._-]+")

# Extensiones que se convierten a PDF para poder previsualizarse (ver
# _convert_to_pdf_preview) — un .pdf ya subido se previsualiza a sí mismo,
# no necesita esto. Word (.doc/.docx) e imágenes quedan fuera a propósito:
# no se pidió vista previa para esos, solo PDF/PPT.
CONVERTIBLE_TO_PREVIEW = {".ppt", ".pptx"}

# Tiempo máximo por conversión. LibreOffice headless puede tardar varios
# segundos incluso en arrancar (no es un límite ajustado al tamaño del
# archivo) — generoso a propósito porque esto corre síncrono dentro del
# request de upload (no hay cola de tareas en este proyecto todavía) y una
# conversión colgada no debe bloquear el worker para siempre.
CONVERSION_TIMEOUT_SECONDS = 90


def _sanitize_filename(original: str) -> str:
    """Se queda solo con el nombre (sin ruta) y normaliza caracteres raros
    para que sea seguro usarlo como parte de una ruta en disco."""
    name = Path(original).name.strip() or "archivo"
    return _UNSAFE_CHARS.sub("_", name)


# ---------------------------------------------------------------------------
# Lookups compartidos (admin + estudiante)
# ---------------------------------------------------------------------------

def get_module_or_404(db: Session, module_id: int) -> Module:
    module = db.get(Module, module_id)
    if module is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Módulo no existe.")
    return module


def get_session_or_404(db: Session, session_id: int) -> CourseSession:
    session = db.scalar(
        select(CourseSession)
        .where(CourseSession.id == session_id)
        .options(selectinload(CourseSession.module), selectinload(CourseSession.attachments))
    )
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesión no existe.")
    return session


def get_attachment_or_404(db: Session, attachment_id: int) -> SessionAttachment:
    attachment = db.scalar(
        select(SessionAttachment)
        .where(SessionAttachment.id == attachment_id)
        .options(selectinload(SessionAttachment.session).selectinload(CourseSession.module))
    )
    if attachment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Adjunto no existe.")
    return attachment


def session_is_visible_to(user: User, session: CourseSession) -> bool:
    """Admin ve todo. Alumno solo si el módulo de la sesión está
    desbloqueado — así una URL de adjunto copiada a mano no filtra
    contenido de un módulo que el profesor aún no libera."""
    if user.is_admin:
        return True
    return session.module.unlocked_at is not None


# ---------------------------------------------------------------------------
# Adjuntos
# ---------------------------------------------------------------------------

def _convert_to_pdf_preview(storage_path: Path, session_dir: Path) -> str | None:
    """Convierte un PPT/PPTX a PDF con LibreOffice headless para la vista
    previa. Nunca lanza — si falla (binario ausente, archivo corrupto,
    timeout), se loguea y se devuelve None: la conversión es un extra, el
    adjunto original ya se guardó bien y el upload no debe fallar por esto.

    `-env:UserInstallation=...` con un directorio único por conversión evita
    que dos subidas simultáneas compitan por el mismo perfil de LibreOffice
    (causa típica de que `soffice` se cuelgue o falle bajo concurrencia)."""
    profile_dir = f"/tmp/lo_profile_{uuid.uuid4().hex}"
    try:
        result = subprocess.run(
            [
                "soffice",
                "--headless",
                f"-env:UserInstallation=file://{profile_dir}",
                "--convert-to",
                "pdf",
                "--outdir",
                str(session_dir),
                str(storage_path),
            ],
            capture_output=True,
            timeout=CONVERSION_TIMEOUT_SECONDS,
        )
    except (subprocess.TimeoutExpired, FileNotFoundError, OSError) as err:
        logger.warning("Conversión a PDF de %s falló: %s", storage_path.name, err)
        return None

    expected_output = session_dir / f"{storage_path.stem}.pdf"
    if result.returncode != 0 or not expected_output.is_file():
        logger.warning(
            "Conversión a PDF de %s salió con código %s: %s",
            storage_path.name,
            result.returncode,
            result.stderr.decode(errors="replace")[:500],
        )
        return None
    return str(expected_output)


def save_attachment(db: Session, session: CourseSession, upload_file: UploadFile) -> SessionAttachment:
    original_name = upload_file.filename or "archivo"
    extension = Path(original_name).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        allowed = ", ".join(sorted(ALLOWED_EXTENSIONS))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de archivo no permitido ({extension or 'sin extensión'}). Usa: {allowed}.",
        )

    safe_name = _sanitize_filename(original_name)
    session_dir = UPLOAD_ROOT / str(session.id)
    session_dir.mkdir(parents=True, exist_ok=True)
    stored_name = f"{uuid.uuid4().hex}_{safe_name}"
    storage_path = session_dir / stored_name

    # Se escribe a disco en bloques acotados en vez de upload_file.file.read()
    # completo: así un archivo enorme se rechaza sin haberlo cargado entero
    # a memoria primero (el límite solo protegía después de ya pagar el costo).
    max_bytes = settings.max_attachment_size_mb * 1024 * 1024
    chunk_size = 1024 * 1024
    size = 0
    try:
        with storage_path.open("wb") as out:
            while True:
                chunk = upload_file.file.read(chunk_size)
                if not chunk:
                    break
                size += len(chunk)
                if size > max_bytes:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"El archivo supera el límite de {settings.max_attachment_size_mb} MB.",
                    )
                out.write(chunk)
    except HTTPException:
        storage_path.unlink(missing_ok=True)
        raise
    if size == 0:
        storage_path.unlink(missing_ok=True)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El archivo está vacío.")

    preview_path = (
        _convert_to_pdf_preview(storage_path, session_dir)
        if extension in CONVERTIBLE_TO_PREVIEW
        else None
    )

    attachment = SessionAttachment(
        session_id=session.id,
        filename=safe_name,
        storage_path=str(storage_path),
        content_type=ALLOWED_EXTENSIONS[extension],
        size_bytes=size,
        preview_path=preview_path,
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return attachment


def delete_attachment(db: Session, attachment: SessionAttachment) -> None:
    # Borra la fila primero: si el commit falla (lock, conexión caída), el
    # archivo en disco sigue ahí y no queda una fila apuntando a un archivo
    # que ya no existe. El archivo se borra solo después de confirmar.
    path = Path(attachment.storage_path)
    preview_path = Path(attachment.preview_path) if attachment.preview_path else None
    db.delete(attachment)
    db.commit()
    path.unlink(missing_ok=True)
    if preview_path is not None:
        preview_path.unlink(missing_ok=True)
