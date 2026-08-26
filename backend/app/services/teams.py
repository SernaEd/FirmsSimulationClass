"""Lógica de negocio de Dominio 2 (Teams).

- Generación algorítmica balanceada.
- Cálculo de tamaños 3/4 según total de alumnos.
- Fallback de nombre por defecto tipo "Firma A", "Firma B".
"""

from __future__ import annotations

import random
import string
from collections import defaultdict
from itertools import product

from sqlalchemy import and_, select
from sqlalchemy.orm import Session, selectinload

from app.models.team import Team, TeamMember, TeamNameStatus
from app.models.user import User, UserProfile, UserStatus


# ---- Cálculo de tamaños 3 / 4 (§6) ----
def compute_team_sizes(total: int, tamano_preferido: int = 4) -> list[int]:
    """Devuelve una lista de tamaños de equipo (3 o 4) que sumen `total`.

    Regla: preferimos equipos del tamaño solicitado (default 4), pero
    reemplazamos algunos por 3 para que la suma sea exacta y nadie quede solo.

    Ejemplos:
      total=25, preferido=4 → [4,4,4,4,4,3] (5×4 + 1×3 = 23)... no, 20+3=23, no cuadra.
      Mejor:  25 = 6×4 + 1×1 → no válido. Buscamos: 25 = 3×3 + 4×4 → 9+16=25 ✓
    """
    if total <= 0:
        return []
    if total <= 4:
        return [total]

    # Buscar combinación (a, b) con 3*a + 4*b = total, minimizando |a-b| y
    # priorizando b (equipos de 4). Espacio pequeño: iteramos.
    best: tuple[int, int] | None = None
    for b in range(total // 4, -1, -1):
        remainder = total - 4 * b
        if remainder < 0 or remainder % 3 != 0:
            continue
        a = remainder // 3
        if a == 0 and b == 0:
            continue
        if best is None:
            best = (a, b)
            continue
        # Preferir el que da más equipos del tamaño preferido
        prev_pref = best[1] if tamano_preferido == 4 else best[0]
        this_pref = b if tamano_preferido == 4 else a
        if this_pref > prev_pref:
            best = (a, b)

    if best is None:
        # No hay combinación exacta (ej. total=5). Devolvemos algo razonable.
        # 5 → [3, 2] no cumple mínimo 3; caso raro, aceptamos un equipo pequeño.
        if total == 5:
            return [3, 2]  # el admin puede reasignar
        # Fallback general: equipos de 4, último absorbe el resto.
        sizes = [4] * (total // 4)
        rem = total % 4
        if rem:
            sizes.append(rem)
        return sizes

    a, b = best
    sizes = [4] * b + [3] * a
    random.shuffle(sizes)
    return sizes


# ---- Generación de equipos con balance por perfil ----
def generate_balanced_teams(
    db: Session,
    tamano_preferido: int = 4,
    incluir_admin: bool = False,
    dry_run: bool = False,
) -> tuple[list[Team], list[str]]:
    """Genera equipos con las cuentas activas que no estén en un equipo activo.

    Balance:
    - Si TODAS las personas tienen perfil asignado → snake draft por perfil.
    - Si NINGUNA lo tiene → aleatorio puro.
    - Si algunas sí y otras no (transitorio hasta que llegue el test de Iter 1)
      → snake draft por perfil para las que lo tengan, resto aleatorio;
      emite warning.

    Devuelve (lista de Team creados, lista de warnings).
    """
    warnings: list[str] = []

    # 1. Filtrar candidatas: activas, sin equipo activo, respetando incluir_admin.
    active_team_member_subq = (
        select(TeamMember.user_id).where(TeamMember.left_at.is_(None)).subquery()
    )
    q = (
        select(User)
        .where(User.estado == UserStatus.active)
        .where(User.id.notin_(select(active_team_member_subq)))
    )
    if not incluir_admin:
        q = q.where(User.is_admin.is_(False))

    candidatas = db.scalars(q).all()
    total = len(candidatas)

    if total == 0:
        return [], ["No hay cuentas activas disponibles para formar equipos."]

    # 2. Calcular tamaños.
    sizes = compute_team_sizes(total, tamano_preferido=tamano_preferido)
    if any(s < 3 for s in sizes):
        warnings.append(
            f"El total ({total}) obliga a un equipo pequeño (<3). "
            "Revisa la asignación y considera unir con otro equipo."
        )

    # 3. Ordenar por perfil (snake draft) o aleatorio.
    con_perfil = [u for u in candidatas if u.perfil is not None]
    sin_perfil = [u for u in candidatas if u.perfil is None]

    if sin_perfil and con_perfil:
        warnings.append(
            f"{len(sin_perfil)} cuenta(s) sin perfil asignado (test de perfil "
            "aún no implementado). Se distribuyen aleatoriamente."
        )

    orden: list[User] = _snake_by_profile(con_perfil) if con_perfil else []
    random.shuffle(sin_perfil)

    # Mezcla determinista simple: intercalar con-perfil y sin-perfil para
    # no dejar todo el 'sin perfil' al final del último equipo.
    combinado: list[User] = []
    max_len = max(len(orden), len(sin_perfil))
    for i in range(max_len):
        if i < len(orden):
            combinado.append(orden[i])
        if i < len(sin_perfil):
            combinado.append(sin_perfil[i])

    # 4. Partir según sizes.
    teams: list[Team] = []
    cursor = 0
    for size in sizes:
        miembros = combinado[cursor:cursor + size]
        cursor += size
        team = Team(estado_nombre=TeamNameStatus.pendiente)
        for u in miembros:
            team.members.append(TeamMember(user_id=u.id))
        teams.append(team)

    if not dry_run:
        db.add_all(teams)
        db.commit()
        for t in teams:
            db.refresh(t)

    return teams, warnings


def _snake_by_profile(users: list[User]) -> list[User]:
    """Snake draft: agrupa por perfil, luego pincha uno de cada perfil por
    ronda, alternando dirección cada ronda para balancear.
    """
    if not users:
        return []
    grupos: dict[UserProfile, list[User]] = defaultdict(list)
    for u in users:
        assert u.perfil is not None
        grupos[u.perfil].append(u)
    for g in grupos.values():
        random.shuffle(g)

    orden_perfiles = list(grupos.keys())
    resultado: list[User] = []
    direccion = 1
    while any(grupos.values()):
        secuencia = orden_perfiles if direccion == 1 else list(reversed(orden_perfiles))
        for p in secuencia:
            if grupos[p]:
                resultado.append(grupos[p].pop())
        direccion *= -1
    return resultado


# ---- Nombre por defecto tipo "Firma A", "Firma B", ... ----
def next_default_firma_name(db: Session) -> str:
    """Devuelve el siguiente nombre disponible del tipo 'Firma A', 'Firma B', ...
    Considera nombres ya usados (tanto propuestos como asignados por sistema).
    """
    existentes = {
        n for n in db.scalars(select(Team.nombre_firma).where(Team.nombre_firma.isnot(None))).all()
    }
    for letra in string.ascii_uppercase:
        candidato = f"Firma {letra}"
        if candidato not in existentes:
            return candidato
    # Si se acaba el alfabeto, seguimos con "Firma AA", "Firma AB", etc.
    for a, b in product(string.ascii_uppercase, repeat=2):
        candidato = f"Firma {a}{b}"
        if candidato not in existentes:
            return candidato
    raise RuntimeError("Sin nombres disponibles (muy improbable).")


# ---- Utilidades varias ----
def get_active_team_of_user(db: Session, user_id: int) -> Team | None:
    stmt = (
        select(Team)
        .join(TeamMember, TeamMember.team_id == Team.id)
        .where(and_(TeamMember.user_id == user_id, TeamMember.left_at.is_(None)))
        .options(selectinload(Team.members))
    )
    return db.scalars(stmt).first()


def get_active_teams_for_users(db: Session, user_ids: list[int]) -> dict[int, Team]:
    """Versión en lote de `get_active_team_of_user`: una sola consulta para
    resolver el equipo activo de varios usuarios a la vez (evita N+1 en
    vistas tipo tabla, ej. Admin · Alumnos)."""
    if not user_ids:
        return {}
    stmt = (
        select(TeamMember.user_id, Team)
        .join(Team, Team.id == TeamMember.team_id)
        .where(and_(TeamMember.user_id.in_(user_ids), TeamMember.left_at.is_(None)))
    )
    return {user_id: team for user_id, team in db.execute(stmt).all()}


def user_is_member_of_team(db: Session, user_id: int, team_id: int) -> bool:
    stmt = select(TeamMember.id).where(
        and_(
            TeamMember.team_id == team_id,
            TeamMember.user_id == user_id,
            TeamMember.left_at.is_(None),
        )
    )
    return db.scalars(stmt).first() is not None
