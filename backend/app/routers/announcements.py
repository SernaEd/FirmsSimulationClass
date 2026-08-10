"""Endpoints de anuncios accesibles a integrantes activos (§11.3.1)."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_active_user
from app.models.user import User
from app.schemas.system import StudentAnnouncementOut
from app.services.announcements import list_active_announcements_for_user, mark_read

router = APIRouter(prefix="/me/announcements", tags=["announcements"])


@router.get("", response_model=list[StudentAnnouncementOut])
def my_announcements(
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    items = list_active_announcements_for_user(db, user)
    return [
        StudentAnnouncementOut(
            **{
                "id": i.announcement.id,
                "titulo": i.announcement.titulo,
                "cuerpo_md": i.announcement.cuerpo_md,
                "prioridad": i.announcement.prioridad,
                "anclado": i.announcement.anclado,
                "alcance_tipo": i.announcement.alcance_tipo,
                "alcance_ids": i.announcement.alcance_ids,
                "autor_id": i.announcement.autor_id,
                "publicado_at": i.announcement.publicado_at,
                "expira_at": i.announcement.expira_at,
                "activo": i.announcement.activo,
                "created_at": i.announcement.created_at,
                "updated_at": i.announcement.updated_at,
                "leido": i.leido,
            }
        )
        for i in items
    ]


@router.post("/{announcement_id}/mark-read", status_code=204)
def mark_announcement_read(
    announcement_id: int,
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    mark_read(db, announcement_id, user)
