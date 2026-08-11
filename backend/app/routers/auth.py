"""Endpoints de autenticación (Dominio 1)."""

import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.deps import get_current_user
from app.models.system import InboxItemType, InboxPriority
from app.models.user import User, UserStatus
from app.rate_limit import limiter
from app.schemas.auth import BootstrapAdminIn, LoginIn, RegisterIn, TokenOut, UserOut
from app.security import create_access_token, hash_pin, verify_pin
from app.services.inbox import create_inbox_item

router = APIRouter(prefix="/auth", tags=["auth"])


def _raise_if_duplicate(db: Session, numero_cuenta: str, nickname: str) -> None:
    existing = db.query(User).filter(
        or_(User.numero_cuenta == numero_cuenta, User.nickname == nickname)
    ).first()
    if existing is not None:
        detail = (
            "Número de cuenta ya registrado."
            if existing.numero_cuenta == numero_cuenta
            else "Nickname ya está en uso."
        )
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail)


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterIn, db: Session = Depends(get_db)) -> User:
    _raise_if_duplicate(db, payload.numero_cuenta, payload.nickname)

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
    db.flush()  # user.id disponible sin cerrar la transacción

    create_inbox_item(
        db,
        tipo=InboxItemType.registro,
        referencia_id=user.id,
        prioridad=InboxPriority.media,
        payload={
            "nombre": user.nombre,
            "apellidos": user.apellidos,
            "numero_cuenta": user.numero_cuenta,
            "nickname": user.nickname,
        },
    )

    db.commit()
    db.refresh(user)
    return user


@router.post(
    "/bootstrap-admin",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,  # no lo listamos en /docs — ver docstring
)
@limiter.limit(
    # Endpoint sensible (crea un admin activo sin aprobación): límite fijo
    # y bajo en todos los ambientes, no solo prod/staging como login.
    "10/hour"
)
def bootstrap_admin(request: Request, payload: BootstrapAdminIn, db: Session = Depends(get_db)) -> User:
    """Crea una cuenta admin ya activa, sin pasar por aprobación de otro
    admin — resuelve el problema del "primer admin" en un ambiente nuevo
    (staging/producción), donde por definición todavía no existe ninguno.

    Protegido por ADMIN_BOOTSTRAP_TOKEN (variable de entorno, nunca en
    código/git) en vez de un rol admin existente. Si la variable no está
    configurada, o el secreto no coincide, responde 404 en vez de 401/403
    para no revelar que el endpoint existe. Compara con secrets.compare_digest
    (tiempo constante) para no filtrar el secreto por timing."""
    if not settings.admin_bootstrap_token or not secrets.compare_digest(
        payload.secret, settings.admin_bootstrap_token
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    _raise_if_duplicate(db, payload.numero_cuenta, payload.nickname)

    user = User(
        nombre=payload.nombre.strip(),
        apellidos=payload.apellidos.strip(),
        numero_cuenta=payload.numero_cuenta.strip(),
        nickname=payload.nickname.strip(),
        pin_hash=hash_pin(payload.pin),
        correo_institucional=payload.correo_institucional,
        pronombres=payload.pronombres,
        estado=UserStatus.active,
        is_admin=True,
        terms_accepted_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenOut)
@limiter.limit(
    # En dev es 100/min para no bloquear pruebas; en prod/staging: 3/15min (§13.1)
    lambda: "100/minute" if settings.environment == "development" else "3/15minutes"
)
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
