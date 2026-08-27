"""Lógica de negocio de licitaciones (§10, §12.6).

- Simulación numérica del Caso 1 (mezcla lineal en tanque / biorreactor).
- Apertura/cierre de licitaciones y envío de respuestas por equipo.
- Podio y acreditación de Tokens al cerrar (banco unificado, Dominio 3).

Ver el docstring de `app.models.licitaciones` para el alcance y las
simplificaciones deliberadas de esta primera versión (sin fase de
"planteo", sin motor WebSocket en tiempo real).
"""

from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Dict, List, Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.economy import TokenSource
from app.models.licitaciones import Caso, EstadoLicitacion, Licitacion, LicitacionResponse
from app.models.team import TeamMember
from app.models.user import User
from app.services.teams import get_active_team_of_user
from app.services.tokens import add_ledger_entry


# ---------------------------------------------------------------------------
# Simulación (mezcla lineal en tanque — hoy el único `tipo_modelo` soportado)
# ---------------------------------------------------------------------------

def simular_tanque(caso: Caso, q: float) -> dict:
    """Resuelve `dA/dt = -(Q/V)*A` (purga con corriente limpia) para una Q
    constante propuesta y evalúa las dos restricciones del caso: llegar a
    `concentracion_max` antes de `plazo_horas` sin superar `presion_max_q`.

    Tiene forma cerrada (`A(t) = A0 * exp(-Q*t/V)`), así que no hace falta
    una librería de integración numérica ni guardar una serie muestreada —
    el frontend reconstruye la curva con los mismos parámetros del caso.
    Solo implementa `TipoModeloCaso.mezcla_lineal_tanque`; el schema/CRUD de
    `Caso` restringe `tipo_modelo` a ese único valor (ver `CasoIn`), así que
    un caso con otro tipo de modelo no puede llegar aquí.
    """
    a_final = caso.concentracion_inicial * math.exp(-q * caso.plazo_horas / caso.volumen_l)

    cumple_plazo = a_final <= caso.concentracion_max
    cumple_presion = q <= caso.presion_max_q
    correcta = cumple_plazo and cumple_presion

    if not cumple_plazo:
        consecuencia = "lote_perdido"
    elif not cumple_presion:
        consecuencia = "linea_danada"
    else:
        consecuencia = "ninguna"

    return {
        "a_final": round(a_final, 4),
        "cumple_plazo": cumple_plazo,
        "cumple_presion": cumple_presion,
        "correcta": correcta,
        "consecuencia": consecuencia,
        "dinero_perdido_mxn": caso.dinero_perdido_mxn if consecuencia == "lote_perdido" else 0,
        "pacientes_afectados": caso.pacientes_afectados if consecuencia == "lote_perdido" else 0,
        "costo_reparacion_mxn": caso.costo_reparacion_mxn if consecuencia == "linea_danada" else 0,
    }


# ---------------------------------------------------------------------------
# Casos (admin)
# ---------------------------------------------------------------------------

def get_caso_or_404(db: Session, caso_id: int) -> Caso:
    caso = db.get(Caso, caso_id)
    if caso is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Caso no existe.")
    return caso


# ---------------------------------------------------------------------------
# Licitaciones — apertura y cierre
# ---------------------------------------------------------------------------

def get_licitacion_or_404(db: Session, licitacion_id: int) -> Licitacion:
    licitacion = db.get(
        Licitacion, licitacion_id, options=[selectinload(Licitacion.caso)]
    )
    if licitacion is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Licitación no existe.")
    return licitacion


def assert_licitacion_existe(db: Session, licitacion_id: int) -> None:
    """Chequeo de existencia sin cargar `caso` — para endpoints que solo
    necesitan el 404 y no el objeto (ej. `GET .../mi-respuesta`)."""
    if db.scalar(select(Licitacion.id).where(Licitacion.id == licitacion_id)) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Licitación no existe.")


def get_licitacion_abierta(db: Session) -> Optional[Licitacion]:
    stmt = (
        select(Licitacion)
        .options(selectinload(Licitacion.caso))
        .where(Licitacion.estado == EstadoLicitacion.abierta)
    )
    return db.scalars(stmt).first()


def abrir_licitacion(
    db: Session,
    admin: User,
    caso_id: int,
    *,
    pts_primero: int,
    pts_segundo: int,
    pts_tercero: int,
    pts_correcta_fuera_podio: int,
    pts_participacion: int,
) -> Licitacion:
    if get_licitacion_abierta(db) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya hay una licitación abierta. Ciérrala antes de abrir otra.",
        )
    caso = get_caso_or_404(db, caso_id)

    licitacion = Licitacion(
        caso_id=caso.id,
        estado=EstadoLicitacion.abierta,
        pts_primero=pts_primero,
        pts_segundo=pts_segundo,
        pts_tercero=pts_tercero,
        pts_correcta_fuera_podio=pts_correcta_fuera_podio,
        pts_participacion=pts_participacion,
        created_by=admin.id,
    )
    db.add(licitacion)
    db.commit()
    db.refresh(licitacion)
    return licitacion


def cerrar_licitacion(db: Session, licitacion_id: int) -> Licitacion:
    licitacion = get_licitacion_or_404(db, licitacion_id)
    if licitacion.estado != EstadoLicitacion.abierta:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"La licitación ya está '{licitacion.estado.value}'.",
        )

    respuestas = list(
        db.scalars(
            select(LicitacionResponse)
            .where(LicitacionResponse.licitacion_id == licitacion.id)
            .order_by(LicitacionResponse.created_at.asc())
        ).all()
    )

    correctas = [r for r in respuestas if r.correcta]
    podio_pts = [licitacion.pts_primero, licitacion.pts_segundo, licitacion.pts_tercero]
    for idx, respuesta in enumerate(correctas):
        respuesta.orden_llegada = idx + 1
        respuesta.puntos_tokens = (
            podio_pts[idx] if idx < len(podio_pts) else licitacion.pts_correcta_fuera_podio
        )
    for respuesta in respuestas:
        if not respuesta.correcta:
            respuesta.puntos_tokens = licitacion.pts_participacion

    _acreditar_tokens(db, respuestas, licitacion)

    licitacion.estado = EstadoLicitacion.cerrada
    licitacion.cerrada_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(licitacion)
    return licitacion


def _acreditar_tokens(
    db: Session, respuestas: List[LicitacionResponse], licitacion: Licitacion
) -> None:
    """Acredita Tokens a los integrantes activos de cada equipo. Resuelve
    los miembros de todos los equipos en una sola consulta (en vez de una
    por respuesta) — una licitación con muchos equipos no debe pagar una
    ida a la base de datos por cada uno."""
    team_ids = {r.team_id for r in respuestas if r.puntos_tokens}
    miembros_por_equipo: Dict[int, List[int]] = {team_id: [] for team_id in team_ids}
    if team_ids:
        rows = db.execute(
            select(TeamMember.team_id, TeamMember.user_id).where(
                TeamMember.team_id.in_(team_ids), TeamMember.left_at.is_(None)
            )
        ).all()
        for team_id, user_id in rows:
            miembros_por_equipo[team_id].append(user_id)

    for respuesta in respuestas:
        if not respuesta.puntos_tokens:
            continue
        if respuesta.correcta:
            posicion = (
                f"lugar #{respuesta.orden_llegada}"
                if respuesta.orden_llegada and respuesta.orden_llegada <= 3
                else "correcta fuera de podio"
            )
        else:
            posicion = "participación"
        nota = f"Licitación #{licitacion.id} — {licitacion.caso.titulo}: {posicion}"
        for user_id in miembros_por_equipo[respuesta.team_id]:
            add_ledger_entry(
                db,
                user_id=user_id,
                delta=respuesta.puntos_tokens,
                fuente=TokenSource.licitacion,
                referencia_tipo="licitacion_response",
                referencia_id=respuesta.id,
                nota=nota,
            )


# ---------------------------------------------------------------------------
# Respuestas (alumno)
# ---------------------------------------------------------------------------

def enviar_respuesta(db: Session, user: User, licitacion_id: int, q: float) -> LicitacionResponse:
    licitacion = get_licitacion_or_404(db, licitacion_id)
    if licitacion.estado != EstadoLicitacion.abierta:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Esta licitación ya cerró; no se aceptan más respuestas.",
        )

    team = get_active_team_of_user(db, user.id)
    if team is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No perteneces a un equipo activo.",
        )

    existente = db.scalar(
        select(LicitacionResponse.id).where(
            LicitacionResponse.licitacion_id == licitacion.id,
            LicitacionResponse.team_id == team.id,
        )
    )
    if existente is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Tu equipo ya envió su respuesta final para esta licitación.",
        )

    resultado = simular_tanque(licitacion.caso, q)
    respuesta = LicitacionResponse(
        licitacion_id=licitacion.id,
        team_id=team.id,
        submitted_by=user.id,
        q_propuesta=q,
        resultado=resultado,
        correcta=resultado["correcta"],
    )
    db.add(respuesta)
    db.commit()
    db.refresh(respuesta)
    return respuesta


def get_mi_respuesta(db: Session, user: User, licitacion_id: int) -> Optional[LicitacionResponse]:
    team = get_active_team_of_user(db, user.id)
    if team is None:
        return None
    return db.scalar(
        select(LicitacionResponse).where(
            LicitacionResponse.licitacion_id == licitacion_id,
            LicitacionResponse.team_id == team.id,
        )
    )
