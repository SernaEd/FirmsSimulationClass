"""Replace tema with course_session_id

Revision ID: 2175716037d8
Revises: 2175716037d7
Create Date: 2026-08-26 19:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2175716037d8'
down_revision: Union[str, None] = '2175716037d7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop tema column
    op.drop_column('daily_exercises', 'tema')
    # Add course_session_id
    op.add_column('daily_exercises', sa.Column('course_session_id', sa.Integer(), nullable=True))
    # Add foreign key constraint
    op.create_foreign_key('fk_daily_exercises_course_session_id', 'daily_exercises', 'course_sessions', ['course_session_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    # Drop foreign key constraint
    op.drop_constraint('fk_daily_exercises_course_session_id', 'daily_exercises', type_='foreignkey')
    # Drop course_session_id
    op.drop_column('daily_exercises', 'course_session_id')
    # Add tema column
    op.add_column('daily_exercises', sa.Column('tema', sa.String(length=255), server_default='General', nullable=False))
