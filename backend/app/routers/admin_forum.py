"""Endpoints admin de Comentarios por Clase — Iteración 1."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_admin
from app.models.user import User
from app.schemas.forum import ForumPostOut, MarkDestacadoIn
from app.services.forum import get_post_or_404, mark_destacado

router = APIRouter(prefix="/admin", tags=["admin:forum"])


@router.post("/sessions/{session_id}/posts/{post_id}/destacar", response_model=ForumPostOut)
def admin_mark_destacado(
    session_id: int,
    post_id: int,
    payload: MarkDestacadoIn,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> ForumPostOut:
    post = get_post_or_404(db, post_id)
    if post.session_id != session_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Publicación no existe.")
    return mark_destacado(db, admin, post, payload.monto_tokens)
