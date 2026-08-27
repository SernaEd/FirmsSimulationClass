"""replace_academic_calendar_with_events

Revision ID: d8a3f6c1b9e2
Revises: c4e91a7f3b6d
Create Date: 2026-08-27 05:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd8a3f6c1b9e2'
down_revision: Union[str, None] = 'c4e91a7f3b6d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_index(op.f('ix_academic_calendar_days_fecha'), table_name='academic_calendar_days')
    op.drop_table('academic_calendar_days')

    op.create_table('calendar_event_types',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('nombre', sa.String(length=60), nullable=False),
    sa.Column('color', sa.String(length=20), nullable=False),
    sa.Column('afecta_racha', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('nombre')
    )

    op.create_table('calendar_events',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('tipo_id', sa.Integer(), nullable=False),
    sa.Column('fecha', sa.Date(), nullable=False),
    sa.Column('titulo', sa.String(length=120), nullable=False),
    sa.Column('descripcion', sa.Text(), nullable=True),
    sa.Column('alcance_tipo', sa.Enum('todos', 'alumno', name='calendareventscope', native_enum=False, length=10), nullable=False),
    sa.Column('alcance_ids', sa.JSON(), nullable=True),
    sa.Column('created_by', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['tipo_id'], ['calendar_event_types.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_calendar_events_tipo_id'), 'calendar_events', ['tipo_id'], unique=False)
    op.create_index(op.f('ix_calendar_events_fecha'), 'calendar_events', ['fecha'], unique=False)
    op.create_index('ix_calendar_events_fecha_alcance', 'calendar_events', ['fecha', 'alcance_tipo'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_calendar_events_fecha_alcance', table_name='calendar_events')
    op.drop_index(op.f('ix_calendar_events_fecha'), table_name='calendar_events')
    op.drop_index(op.f('ix_calendar_events_tipo_id'), table_name='calendar_events')
    op.drop_table('calendar_events')
    op.drop_table('calendar_event_types')

    op.create_table('academic_calendar_days',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('fecha', sa.Date(), nullable=False),
    sa.Column('motivo', sa.String(length=200), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('created_by', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_academic_calendar_days_fecha'), 'academic_calendar_days', ['fecha'], unique=True)
