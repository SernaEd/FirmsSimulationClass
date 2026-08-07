"""Endpoints admin de Dominio 2 (Teams)."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.deps import get_current_admin
from app.models.team import (
    ProposalStatus,
    Team,
    TeamMember,
    TeamNameProposal,
    TeamNameStatus,
)
from app.models.user import User
from app.schemas.team import (
    AssignDefaultNameIn,
    GenerateTeamsIn,
    GenerateTeamsResult,
    ProposalOut,
    RejectProposalIn,
    RenameTeamIn,
    TeamMemberOut,
    TeamOut,
)
from app.services.teams import (
    generate_balanced_teams,
    next_default_firma_name,
)

router = APIRouter(prefix="/admin", tags=["admin:teams"])


# ---- Serializador auxiliar (evita queries N+1 al armar TeamOut) ----
def _team_to_out(db: Session, team: Team) -> TeamOut:
    user_ids = [m.user_id for m in team.members if m.left_at is None]
    users_map: dict[int, User] = {}
    if user_ids:
        for u in db.scalars(select(User).where(User.id.in_(user_ids))).all():
            users_map[u.id] = u
    members_out = [
        TeamMemberOut(
            user_id=m.user_id,
            nombre=users_map[m.user_id].nombre,
            apellidos=users_map[m.user_id].apellidos,
            nickname=users_map[m.user_id].nickname,
            perfil=(users_map[m.user_id].perfil.value if users_map[m.user_id].perfil else None),
            joined_at=m.joined_at,
        )
        for m in team.members
        if m.left_at is None and m.user_id in users_map
    ]
    return TeamOut(
        id=team.id,
        nombre_firma=team.nombre_firma,
        estado_nombre=team.estado_nombre,
        created_at=team.created_at,
        members=members_out,
    )


# ---- Equipos ----
@router.post("/teams/generate", response_model=GenerateTeamsResult)
def generate_teams(
    payload: GenerateTeamsIn,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> GenerateTeamsResult:
    teams, warnings = generate_balanced_teams(
        db=db,
        tamano_preferido=payload.tamano_preferido,
        incluir_admin=payload.incluir_admin,
        dry_run=payload.dry_run,
    )
    result = GenerateTeamsResult(
        total_alumnos_disponibles=sum(len([m for m in t.members if m.left_at is None]) for t in teams),
        equipos_generados=len(teams),
        tamanos=[len([m for m in t.members if m.left_at is None]) for t in teams],
        teams=[_team_to_out(db, t) for t in teams] if teams else None,
        warnings=warnings,
    )
    return result


@router.get("/teams", response_model=list[TeamOut])
def list_teams(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[TeamOut]:
    teams = db.scalars(
        select(Team).options(selectinload(Team.members)).order_by(Team.created_at.asc())
    ).all()
    return [_team_to_out(db, t) for t in teams]


@router.delete("/teams/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(
    team_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> None:
    team = db.get(Team, team_id)
    if team is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Equipo no existe.")
    db.delete(team)
    db.commit()


def _set_team_name(
    db: Session,
    team: Team,
    nombre: str,
    nuevo_estado: TeamNameStatus,
) -> None:
    """Aplica un nombre a un equipo, valida unicidad y superseda propuestas
    pendientes. NO hace commit — el caller decide."""
    other = db.scalar(select(Team).where(Team.nombre_firma == nombre, Team.id != team.id))
    if other is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"El nombre '{nombre}' ya está en uso por otro equipo.",
        )
    team.nombre_firma = nombre
    team.estado_nombre = nuevo_estado
    now = datetime.now(timezone.utc)
    for p in team.name_proposals:
        if p.estado == ProposalStatus.pendiente_mod:
            p.estado = ProposalStatus.superseded
            p.resolved_at = now


@router.post("/teams/{team_id}/rename", response_model=TeamOut)
def rename_team(
    team_id: int,
    payload: RenameTeamIn,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> TeamOut:
    """Cambio de nombre a criterio del admin. Estado resultante: `aprobado`."""
    team = db.get(Team, team_id)
    if team is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Equipo no existe.")
    _set_team_name(db, team, payload.nombre, TeamNameStatus.aprobado)
    db.commit()
    db.refresh(team)
    return _team_to_out(db, team)


@router.post("/teams/{team_id}/assign-default-name", response_model=TeamOut)
def assign_default_name(
    team_id: int,
    payload: AssignDefaultNameIn,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> TeamOut:
    """Asigna nombre fallback 'Firma A/B/…'. Estado: `asignado_por_sistema`."""
    team = db.get(Team, team_id)
    if team is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Equipo no existe.")

    nombre = payload.nombre or next_default_firma_name(db)
    _set_team_name(db, team, nombre, TeamNameStatus.asignado_por_sistema)
    db.commit()
    db.refresh(team)
    return _team_to_out(db, team)


# ---- Propuestas de nombre ----
@router.get("/team-name-proposals/pending", response_model=list[ProposalOut])
def list_pending_proposals(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[TeamNameProposal]:
    return db.scalars(
        select(TeamNameProposal)
        .where(TeamNameProposal.estado == ProposalStatus.pendiente_mod)
        .order_by(TeamNameProposal.created_at.asc())
    ).all()


@router.post("/team-name-proposals/{proposal_id}/approve", response_model=TeamOut)
def approve_proposal(
    proposal_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> TeamOut:
    proposal = db.get(TeamNameProposal, proposal_id)
    if proposal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Propuesta no existe.")
    if proposal.estado != ProposalStatus.pendiente_mod:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Propuesta en estado '{proposal.estado.value}', no se puede aprobar.",
        )

    # Chequear que el nombre no esté en uso por otro equipo
    other = db.scalar(
        select(Team).where(Team.nombre_firma == proposal.propuesta, Team.id != proposal.team_id)
    )
    if other is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"El nombre '{proposal.propuesta}' ya está en uso por otro equipo.",
        )

    now = datetime.now(timezone.utc)
    team = db.get(Team, proposal.team_id)
    assert team is not None
    team.nombre_firma = proposal.propuesta
    team.estado_nombre = TeamNameStatus.aprobado

    proposal.estado = ProposalStatus.aprobado
    proposal.resolved_at = now
    proposal.resolved_by = admin.id

    # Superseder otras propuestas pendientes del mismo equipo
    others_stmt = (
        select(TeamNameProposal)
        .where(TeamNameProposal.team_id == team.id)
        .where(TeamNameProposal.estado == ProposalStatus.pendiente_mod)
        .where(TeamNameProposal.id != proposal.id)
    )
    for other_prop in db.scalars(others_stmt).all():
        other_prop.estado = ProposalStatus.superseded
        other_prop.resolved_at = now

    db.commit()
    db.refresh(team)
    return _team_to_out(db, team)


@router.post("/team-name-proposals/{proposal_id}/reject", response_model=ProposalOut)
def reject_proposal(
    proposal_id: int,
    payload: RejectProposalIn,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> TeamNameProposal:
    proposal = db.get(TeamNameProposal, proposal_id)
    if proposal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Propuesta no existe.")
    if proposal.estado != ProposalStatus.pendiente_mod:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Propuesta en estado '{proposal.estado.value}', no se puede rechazar.",
        )
    proposal.estado = ProposalStatus.rechazado
    proposal.resolved_at = datetime.now(timezone.utc)
    proposal.resolved_by = admin.id
    proposal.nota_moderacion = payload.nota_moderacion
    db.commit()
    db.refresh(proposal)
    return proposal
