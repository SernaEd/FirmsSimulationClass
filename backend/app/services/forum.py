"""Lógica de negocio de Comentarios por Clase (foro por sesión) — Iteración 1.

Un `ForumPost` cuelga de una `CourseSession` y admite un nivel de respuestas
(`parent_post_id`). Al publicar, el alumno elige mostrar su nickname o
publicar anónimo para pares — en ambos casos el profesor ve el autor real
(§9 de implementation_plan_v2.md). El profesor puede marcar un post como
destacado desde admin, lo que le otorga un bono de Tokens al autor y lo
ancla al inicio del hilo.
"""

from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session, selectinload

from app.models.content import CourseSession, ForumPost
from app.models.economy import TokenSource
from app.models.user import User
from app.schemas.forum import ForumPostIn, ForumPostOut
from app.services.tokens import add_ledger_entry

MAX_POSTS_PER_HOUR = 5


def _autor_nombre(post: ForumPost, viewer: User) -> str:
    if not post.es_anonimo_para_pares:
        return post.user.nickname
    if viewer.is_admin or post.user_id == viewer.id:
        return post.user.nickname
    return "Anónimo"


def _build_out(post: ForumPost, viewer: User) -> ForumPostOut:
    return ForumPostOut(
        id=post.id,
        session_id=post.session_id,
        parent_post_id=post.parent_post_id,
        cuerpo=post.cuerpo,
        es_anonimo_para_pares=post.es_anonimo_para_pares,
        destacado=post.destacado,
        created_at=post.created_at,
        autor_nombre=_autor_nombre(post, viewer),
        es_mio=(post.user_id == viewer.id),
    )


def get_post_or_404(db: Session, post_id: int) -> ForumPost:
    post = db.scalar(
        select(ForumPost).where(ForumPost.id == post_id).options(selectinload(ForumPost.user))
    )
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publicación no existe.")
    return post


def list_posts_for_session(db: Session, session: CourseSession, viewer: User) -> list[ForumPostOut]:
    rows = list(
        db.scalars(
            select(ForumPost)
            .where(ForumPost.session_id == session.id)
            .options(selectinload(ForumPost.user))
            .order_by(ForumPost.created_at.asc())
        ).all()
    )

    built: dict[int, ForumPostOut] = {p.id: _build_out(p, viewer) for p in rows}
    top_level: list[ForumPostOut] = []
    for p in rows:
        out = built[p.id]
        if p.parent_post_id is None:
            top_level.append(out)
        else:
            parent_out = built.get(p.parent_post_id)
            if parent_out is not None:
                parent_out.replies.append(out)

    # Destacado se ancla al inicio del hilo (§9); el resto queda cronológico.
    # Las respuestas nunca se reordenan dentro de su post padre.
    top_level.sort(key=lambda o: (not o.destacado, o.created_at))
    return top_level


def create_post(db: Session, session: CourseSession, user: User, payload: ForumPostIn) -> ForumPostOut:
    cuerpo = payload.cuerpo.strip()
    if not cuerpo:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El comentario no puede estar vacío.")

    parent: ForumPost | None = None
    if payload.parent_post_id is not None:
        parent = db.get(ForumPost, payload.parent_post_id)
        if parent is None or parent.session_id != session.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La publicación a la que respondes no existe en esta sesión.",
            )
        if parent.parent_post_id is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo se puede responder a comentarios de primer nivel.",
            )

    # Límite de 5 publicaciones/hora por alumno en este foro (§9, §13.1). El
    # profesor está exento — el límite frena flooding de un par, no su
    # propia participación respondiendo dudas en el hilo.
    #
    # El cutoff se calcula del lado de MySQL (NOW() - INTERVAL), no con
    # datetime.now(timezone.utc) en Python: created_at se puebla vía
    # server_default=func.now(), que corre en la zona horaria del propio
    # servidor MySQL (America/Mexico_City en docker-compose, ver TZ), no en
    # UTC. Comparar contra un cutoff calculado en Python-UTC desalinea el
    # WHERE por el offset completo de la zona y el límite nunca dispara.
    if not user.is_admin:
        recent = db.scalar(
            select(func.count(ForumPost.id))
            .where(ForumPost.user_id == user.id)
            .where(ForumPost.session_id == session.id)
            .where(ForumPost.created_at >= text("(NOW() - INTERVAL 1 HOUR)"))
        )
        if recent is not None and recent >= MAX_POSTS_PER_HOUR:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Alcanzaste el límite de {MAX_POSTS_PER_HOUR} publicaciones por hora en este foro.",
            )

    post = ForumPost(
        session_id=session.id,
        user_id=user.id,
        parent_post_id=parent.id if parent else None,
        cuerpo=cuerpo,
        # El profesor siempre publica bajo su nombre real — la anonimidad es
        # una opción para pares, no aplica a admin aunque el frontend ya
        # esconda el checkbox (esto es la validación real, no solo UI).
        es_anonimo_para_pares=payload.es_anonimo_para_pares and not user.is_admin,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    post.user = user  # ya lo tenemos cargado; evita un round-trip extra
    return _build_out(post, user)


def mark_destacado(db: Session, admin: User, post: ForumPost, monto_tokens: int) -> ForumPostOut:
    if post.destacado:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Esta publicación ya está destacada.")

    author = post.user  # capturado antes de commit/refresh (expiran la relación)
    post.destacado = True
    add_ledger_entry(
        db,
        user_id=post.user_id,
        delta=monto_tokens,
        fuente=TokenSource.post_destacado,
        referencia_tipo="forum_post",
        referencia_id=post.id,
        nota=f"Post destacado en sesión {post.session_id}",
        admin_id=admin.id,
    )
    db.commit()
    db.refresh(post)
    post.user = author
    return _build_out(post, admin)
