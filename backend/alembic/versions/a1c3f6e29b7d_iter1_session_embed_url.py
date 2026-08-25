"""iter1_session_embed_url

Consolida /clase1 (página standalone con nav propio, ver TopNav) dentro
del sistema real de contenido (/clases): agrega `embed_url` a
course_sessions — a diferencia de un SessionAttachment (archivo subido y
descargable), esto apunta a contenido servido aparte para embeber en un
iframe (típicamente un asset estático, como el deck de Sesión 1 en
frontend/public/clase1-content/).

También siembra "Módulo 1 / Presentación del curso" apuntando a ese mismo
deck (frontend/public/clase1-content/index.html, sin moverlo/duplicarlo),
desbloqueado desde ya — solo si no existe ya un módulo #1, para no pisar
contenido que el profesor haya creado a mano por su cuenta. Si se omite
por esa razón, hay que agregar el embed manualmente desde
/admin/contenido (el campo ya existe ahí tras esta migración).

Revision ID: a1c3f6e29b7d
Revises: 6c5beff19155
Create Date: 2026-08-25 12:00:00.000000

"""
from datetime import datetime, timezone
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'a1c3f6e29b7d'
down_revision: Union[str, None] = '6c5beff19155'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

MODULES = sa.table(
    "modules",
    sa.column("id", sa.Integer),
    sa.column("numero", sa.Integer),
    sa.column("nombre", sa.String),
    sa.column("unlocked_at", sa.DateTime),
)
COURSE_SESSIONS = sa.table(
    "course_sessions",
    sa.column("id", sa.Integer),
    sa.column("module_id", sa.Integer),
    sa.column("numero_sesion", sa.Integer),
    sa.column("titulo", sa.String),
    sa.column("descripcion", sa.Text),
    sa.column("embed_url", sa.String),
)


def upgrade() -> None:
    op.add_column("course_sessions", sa.Column("embed_url", sa.String(length=500), nullable=True))

    bind = op.get_bind()
    existing = bind.execute(sa.select(MODULES.c.id).where(MODULES.c.numero == 1)).first()
    if existing is not None:
        return

    result = bind.execute(
        MODULES.insert().values(
            numero=1,
            nombre="Introducción",
            unlocked_at=datetime.now(timezone.utc),
        )
    )
    # `.inserted_primary_key` no sirve aquí: `sa.table()`/`sa.column()` (a
    # diferencia de `sa.Table()` con metadata real) no declaran cuál
    # columna es la primary key, así que SQLAlchemy no tiene de dónde
    # devolverla. `.lastrowid` sí funciona — lee directo el cursor del
    # DBAPI (pymysql/mysqlclient lo soportan igual que sqlite3).
    module_id = result.lastrowid

    bind.execute(
        COURSE_SESSIONS.insert().values(
            module_id=module_id,
            numero_sesion=1,
            titulo="Presentación del curso",
            descripcion=(
                "Introducción al curso: qué son las ecuaciones diferenciales, "
                "la metáfora de las firmas consultoras y el temario oficial."
            ),
            embed_url="/clase1-content/index.html",
        )
    )


def downgrade() -> None:
    # No se borra el módulo/sesión sembrados aquí: si el profesor ya editó
    # ese contenido (agregó adjuntos, cambió el texto), un downgrade no
    # tiene forma confiable de distinguir "sigue siendo lo que sembré" de
    # "ya lo personalizaron" — perder esos cambios sería peor que dejar una
    # columna de más. Solo se revierte el cambio de esquema.
    op.drop_column("course_sessions", "embed_url")
