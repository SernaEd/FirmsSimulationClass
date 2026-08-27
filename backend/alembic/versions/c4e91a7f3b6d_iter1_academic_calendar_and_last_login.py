"""iter1_academic_calendar_and_last_login

Revision ID: c4e91a7f3b6d
Revises: 088ee53fe24c
Create Date: 2026-08-27 04:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c4e91a7f3b6d'
down_revision: Union[str, None] = '088ee53fe24c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
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

    op.add_column('users', sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'last_login_at')

    op.drop_index(op.f('ix_academic_calendar_days_fecha'), table_name='academic_calendar_days')
    op.drop_table('academic_calendar_days')
