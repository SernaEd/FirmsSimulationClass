"""Endpoints de Dominio 2 (Teams) accesibles a integrantes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_active_user
from app.models.system import InboxItemType, InboxPriority
from app.models.team import ProposalStatus, TeamNameProposal, TeamNameStatus
from app.models.user import User
from app.routers.admin_teams import _team_to_out
from app.schemas.team import ProposalOut, ProposeNameIn, TeamOut
from app.services.inbox import create_inbox_item, resolve_inbox_items
from app.services.teams import get_active_team_of_user, user_is_member_of_team

router = APIRouter(tags=["teams"])


@router.get("/me/team", response_model=TeamOut | None)
def my_team(
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> TeamOut | None:
    team = get_active_team_of_user(db, user.id)
    if team is None:
        return None
    return _team_to_out(db, team)


@router.post("/teams/{team_id}/propose-name", response_model=ProposalOut, status_code=status.HTTP_201_CREATED)
def propose_name(
    team_id: int,
    payload: ProposeNameIn,
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> TeamNameProposal:
    if not user_is_member_of_team(db, user.id, team_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo integrantes activos del equipo pueden proponer un nombre.",
        )

    # No permitir proponer si el equipo ya tiene nombre aprobado por moderación.
    from app.models.team import Team
    team = db.get(Team, team_id)
    assert team is not None
    if team.estado_nombre == TeamNameStatus.aprobado:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El equipo ya tiene un nombre aprobado. Solicita al admin cambiarlo.",
        )

    # Superseder la propuesta pendiente previa (regla MVP: una activa a la vez).
    stmt = (
        select(TeamNameProposal)
        .where(TeamNameProposal.team_id == team_id)
        .where(TeamNameProposal.estado == ProposalStatus.pendiente_mod)
    )
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    for prev in db.scalars(stmt).all():
        prev.estado = ProposalStatus.superseded
        prev.resolved_at = now
        resolve_inbox_items(
            db,
            InboxItemType.nombre_firma,
            prev.id,
            nota="Reemplazada por una propuesta más reciente del equipo.",
        )

    proposal = TeamNameProposal(
        team_id=team_id,
        propuesta=payload.propuesta,
        propuesto_por=user.id,
    )
    db.add(proposal)
    db.flush()  # proposal.id disponible sin cerrar la transacción

    create_inbox_item(
        db,
        tipo=InboxItemType.nombre_firma,
        referencia_id=proposal.id,
        prioridad=InboxPriority.baja,
        payload={
            "team_id": team_id,
            "propuesta": proposal.propuesta,
            "propuesto_por_id": user.id,
            "propuesto_por_nickname": user.nickname,
        },
    )

    db.commit()
    db.refresh(proposal)
    return proposal


@router.get("/teams/{team_id}/name-proposals", response_model=list[ProposalOut])
def list_team_proposals(
    team_id: int,
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> list[TeamNameProposal]:
    if not (user.is_admin or user_is_member_of_team(db, user.id, team_id)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No autorizado a ver propuestas de este equipo.",
        )
    return db.scalars(
        select(TeamNameProposal)
        .where(TeamNameProposal.team_id == team_id)
        .order_by(TeamNameProposal.created_at.desc())
    ).all()
