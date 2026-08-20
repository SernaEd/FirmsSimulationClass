"""iter1_content_direct_edit

Se reemplaza el plan de sincronizar sesiones desde Notion (nunca
implementado) por edición directa: el admin escribe una `descripcion` por
sesión y sube sus propios adjuntos (PDF/PPTX/Word/imágenes). Ver
plan_de_tareas_mvp.md > Iteración 1.

Revision ID: 6c5beff19155
Revises: de29d7d6d06f
Create Date: 2026-08-19 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '6c5beff19155'
down_revision: Union[str, None] = 'de29d7d6d06f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # MySQL nombra la unique key sin nombre explícito con el nombre de la
    # columna ('notion_page_id') — hay que soltarla antes de poder soltar
    # la columna.
    op.drop_constraint('notion_page_id', 'course_sessions', type_='unique')
    op.drop_column('course_sessions', 'notion_page_id')
    op.drop_column('course_sessions', 'apuntes_pdf_url')
    op.drop_column('course_sessions', 'notion_last_sync')
    op.add_column('course_sessions', sa.Column('descripcion', sa.Text(), nullable=True))

    op.create_table('session_attachments',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('session_id', sa.Integer(), nullable=False),
    sa.Column('filename', sa.String(length=255), nullable=False),
    sa.Column('storage_path', sa.String(length=500), nullable=False),
    sa.Column('content_type', sa.String(length=100), nullable=False),
    sa.Column('size_bytes', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['session_id'], ['course_sessions.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_session_attachments_session_id'), 'session_attachments', ['session_id'], unique=False)


def downgrade() -> None:
    # Asume que no hay filas existentes en course_sessions (pre-lanzamiento,
    # sin sesiones reales creadas todavía) — notion_page_id vuelve como
    # NOT NULL igual que en la migración original de29d7d6d06f.
    op.drop_table('session_attachments')
    op.drop_column('course_sessions', 'descripcion')
    op.add_column('course_sessions', sa.Column('notion_last_sync', sa.DateTime(timezone=True), nullable=True))
    op.add_column('course_sessions', sa.Column('apuntes_pdf_url', sa.String(length=500), nullable=True))
    op.add_column('course_sessions', sa.Column('notion_page_id', sa.String(length=64), nullable=False))
    op.create_unique_constraint('notion_page_id', 'course_sessions', ['notion_page_id'])
