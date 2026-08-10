"""Endpoints admin del publicador de anuncios (§11.3.1)."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_admin
from app.models.user import User
from app.schemas.system import AdminAnnouncementOut, AnnouncementIn, AnnouncementUpdate
from app.services.announcements import (
    AnnouncementWithStats,
    create_announcement,
    get_announcement_stats,
    list_admin_announcements,
    soft_delete_announcement,
    update_announcement,
)

router = APIRouter(prefix="/admin/announcements", tags=["admin:announcements"])


def _to_admin_out(item: AnnouncementWithStats) -> AdminAnnouncementOut:
    a = item.announcement
    return AdminAnnouncementOut(
        id=a.id,
        titulo=a.titulo,
        cuerpo_md=a.cuerpo_md,
        prioridad=a.prioridad,
        anclado=a.anclado,
        alcance_tipo=a.alcance_tipo,
        alcance_ids=a.alcance_ids,
        autor_id=a.autor_id,
        publicado_at=a.publicado_at,
        expira_at=a.expira_at,
        activo=a.activo,
        created_at=a.created_at,
        updated_at=a.updated_at,
        read_count=item.read_count,
        audience_size=item.audience_size,
    )


@router.get("", response_model=list[AdminAnnouncementOut])
def list_announcements(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    return [_to_admin_out(item) for item in list_admin_announcements(db)]


@router.post("", response_model=AdminAnnouncementOut, status_code=201)
def create(
    payload: AnnouncementIn,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    ann = create_announcement(
        db,
        admin,
        titulo=payload.titulo,
        cuerpo_md=payload.cuerpo_md,
        prioridad=payload.prioridad,
        anclado=payload.anclado,
        alcance_tipo=payload.alcance_tipo,
        alcance_ids=payload.alcance_ids,
        expira_at=payload.expira_at,
    )
    return _to_admin_out(get_announcement_stats(db, ann.id))


@router.patch("/{announcement_id}", response_model=AdminAnnouncementOut)
def update(
    announcement_id: int,
    payload: AnnouncementUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    data = payload.model_dump(exclude_unset=True)
    update_announcement(db, announcement_id, **data)
    return _to_admin_out(get_announcement_stats(db, announcement_id))


@router.delete("/{announcement_id}", status_code=204)
def delete(
    announcement_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    soft_delete_announcement(db, announcement_id)
