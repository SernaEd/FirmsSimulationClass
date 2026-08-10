"""Lógica de negocio del publicador de anuncios (§11.3.1, Dominio 4)."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.system import (
    Announcement,
    AnnouncementPriority,
    AnnouncementRead,
    AnnouncementScope,
)
from app.models.team import TeamMember
from app.models.user import User, UserStatus
from app.services.teams import get_active_team_of_user


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------

def create_announcement(
    db: Session,
    admin: User,
    titulo: str,
    cuerpo_md: str,
    prioridad: AnnouncementPriority,
    anclado: bool,
    alcance_tipo: AnnouncementScope,
    alcance_ids: list[int] | None,
    expira_at: datetime | None = None,
) -> Announcement:
    if alcance_tipo != AnnouncementScope.todos and not alcance_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debes especificar al menos un equipo o alumno para este alcance.",
        )
    if expira_at is not None and expira_at <= datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La fecha de expiración debe ser futura.",
        )

    announcement = Announcement(
        titulo=titulo.strip(),
        cuerpo_md=cuerpo_md,
        prioridad=prioridad,
        anclado=anclado,
        alcance_tipo=alcance_tipo,
        alcance_ids=alcance_ids if alcance_tipo != AnnouncementScope.todos else None,
        autor_id=admin.id,
        expira_at=expira_at,
    )
    db.add(announcement)
    db.commit()
    db.refresh(announcement)
    return announcement


def update_announcement(
    db: Session,
    announcement_id: int,
    **fields,
) -> Announcement:
    ann = db.get(Announcement, announcement_id)
    if ann is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Anuncio no existe.")
    for k, v in fields.items():
        setattr(ann, k, v)
    db.commit()
    db.refresh(ann)
    return ann


def soft_delete_announcement(db: Session, announcement_id: int) -> None:
    ann = db.get(Announcement, announcement_id)
    if ann is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Anuncio no existe.")
    ann.activo = False
    db.commit()


@dataclass
class AnnouncementWithStats:
    announcement: Announcement
    read_count: int
    audience_size: int


def compute_audience_size(db: Session, ann: Announcement) -> int:
    if ann.alcance_tipo == AnnouncementScope.todos:
        return db.scalar(
            select(func.count(User.id)).where(
                User.estado == UserStatus.active, User.is_admin.is_(False)
            )
        ) or 0
    if ann.alcance_tipo == AnnouncementScope.alumno:
        return len(ann.alcance_ids or [])
    if ann.alcance_tipo == AnnouncementScope.equipo:
        team_ids = ann.alcance_ids or []
        if not team_ids:
            return 0
        return db.scalar(
            select(func.count(TeamMember.id)).where(
                TeamMember.team_id.in_(team_ids), TeamMember.left_at.is_(None)
            )
        ) or 0
    return 0


def get_announcement_stats(db: Session, announcement_id: int) -> AnnouncementWithStats:
    """Recalcula read_count/audience_size en frío para una sola entrada
    (usado tras crear/editar, cuando no vale la pena releer todo el listado)."""
    ann = db.get(Announcement, announcement_id)
    if ann is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Anuncio no existe.")
    read_count = db.scalar(
        select(func.count(AnnouncementRead.id)).where(
            AnnouncementRead.announcement_id == announcement_id
        )
    ) or 0
    return AnnouncementWithStats(
        announcement=ann, read_count=read_count, audience_size=compute_audience_size(db, ann)
    )


def list_admin_announcements(db: Session) -> list[AnnouncementWithStats]:
    anns = list(
        db.scalars(select(Announcement).order_by(Announcement.created_at.desc())).all()
    )
    result = []
    for ann in anns:
        read_count = db.scalar(
            select(func.count(AnnouncementRead.id)).where(
                AnnouncementRead.announcement_id == ann.id
            )
        ) or 0
        result.append(
            AnnouncementWithStats(
                announcement=ann,
                read_count=read_count,
                audience_size=compute_audience_size(db, ann),
            )
        )
    return result


# ---------------------------------------------------------------------------
# Alumno
# ---------------------------------------------------------------------------

def _announcement_matches_user(db: Session, ann: Announcement, user: User) -> bool:
    if ann.alcance_tipo == AnnouncementScope.todos:
        return True
    if ann.alcance_tipo == AnnouncementScope.alumno:
        return user.id in (ann.alcance_ids or [])
    if ann.alcance_tipo == AnnouncementScope.equipo:
        team = get_active_team_of_user(db, user.id)
        if team is None:
            return False
        return team.id in (ann.alcance_ids or [])
    return False


@dataclass
class AnnouncementForUser:
    announcement: Announcement
    leido: bool


def list_active_announcements_for_user(db: Session, user: User) -> list[AnnouncementForUser]:
    now = datetime.now(timezone.utc)
    candidates = db.scalars(
        select(Announcement)
        .where(Announcement.activo.is_(True))
        .where(Announcement.publicado_at <= now)
    ).all()

    read_ids = set(
        db.scalars(
            select(AnnouncementRead.announcement_id).where(AnnouncementRead.user_id == user.id)
        ).all()
    )

    visible = []
    for ann in candidates:
        if ann.expira_at is not None and ann.expira_at <= now:
            continue
        if not _announcement_matches_user(db, ann, user):
            continue
        visible.append(AnnouncementForUser(announcement=ann, leido=ann.id in read_ids))

    priority_order = {AnnouncementPriority.alta: 0, AnnouncementPriority.normal: 1}
    visible.sort(
        key=lambda a: (
            0 if a.announcement.anclado else 1,
            priority_order.get(a.announcement.prioridad, 9),
            -a.announcement.publicado_at.timestamp(),
        )
    )
    return visible


def mark_read(db: Session, announcement_id: int, user: User) -> None:
    ann = db.get(Announcement, announcement_id)
    if ann is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Anuncio no existe.")

    existing = db.scalar(
        select(AnnouncementRead).where(
            AnnouncementRead.announcement_id == announcement_id,
            AnnouncementRead.user_id == user.id,
        )
    )
    if existing is not None:
        return  # idempotente
    db.add(AnnouncementRead(announcement_id=announcement_id, user_id=user.id))
    db.commit()
