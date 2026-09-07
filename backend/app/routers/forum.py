"""Endpoints de Comentarios por Clase para el alumno — Iteración 1."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_active_user
from app.models.user import User
from app.schemas.forum import ForumPostIn, ForumPostOut
from app.services.content import get_session_or_404, session_is_visible_to
from app.services.forum import create_post, list_posts_for_session

router = APIRouter(tags=["forum"])


@router.get("/sessions/{session_id}/posts", response_model=list[ForumPostOut])
def list_posts(
    session_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
) -> list[ForumPostOut]:
    session = get_session_or_404(db, session_id)
    if not session_is_visible_to(user, session):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesión no existe.")
    return list_posts_for_session(db, session, user)


@router.post("/sessions/{session_id}/posts", response_model=ForumPostOut, status_code=status.HTTP_201_CREATED)
def create_post_route(
    session_id: int,
    payload: ForumPostIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
) -> ForumPostOut:
    session = get_session_or_404(db, session_id)
    if not session_is_visible_to(user, session):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesión no existe.")
    return create_post(db, session, user, payload)
