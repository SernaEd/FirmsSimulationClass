"""Endpoints de autenticación (Dominio 1)."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.deps import get_current_user
from app.models.user import User, UserStatus
from app.rate_limit import limiter
from app.schemas.auth import LoginIn, RegisterIn, TokenOut, UserOut
from app.security import create_access_token, hash_pin, verify_pin

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterIn, db: Session = Depends(get_db)) -> User:
    existing = db.query(User).filter(
        or_(User.numero_cuenta == payload.numero_cuenta, User.nickname == payload.nickname)
    ).first()
    if existing is not None:
        detail = (
            "Número de cuenta ya registrado."
            if existing.numero_cuenta == payload.numero_cuenta
            else "Nickname ya está en uso."
        )
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail)

    user = User(
        nombre=payload.nombre.strip(),
        apellidos=payload.apellidos.strip(),
        numero_cuenta=payload.numero_cuenta.strip(),
        nickname=payload.nickname.strip(),
        pin_hash=hash_pin(payload.pin),
        correo_institucional=payload.correo_institucional,
        pronombres=payload.pronombres,
        # TODO(iter-1): cuando exista el test de perfil, cambiar a
        # UserStatus.pending_profile — la persona pasa por el test antes de
        # que el profesor apruebe. Ver plan_de_tareas_mvp.md / Iteración 1.
        estado=UserStatus.pending_approval,
        terms_accepted_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenOut)
@limiter.limit("3/15minutes")
def login(request: Request, payload: LoginIn, db: Session = Depends(get_db)) -> TokenOut:
    user = db.query(User).filter(User.numero_cuenta == payload.numero_cuenta).first()
    if user is None or not verify_pin(payload.pin, user.pin_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Número de cuenta o PIN incorrecto.",
        )

    token = create_access_token(subject=user.id, extra_claims={"is_admin": user.is_admin})
    return TokenOut(
        access_token=token,
        expires_in_minutes=settings.jwt_access_token_minutes,
    )


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> User:
    return user
