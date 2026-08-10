"""d4_remove_announcements

Revision ID: 5856aa859e12
Revises: f28e6bc07eca
Create Date: 2026-08-09 19:26:06.139448

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

revision: str = '5856aa859e12'
down_revision: Union[str, None] = 'f28e6bc07eca'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Orden corregido a mano: 'announcement_reads' tiene una FK hacia
    # 'announcements' (ON DELETE CASCADE aplica a filas, no protege un
    # DROP TABLE del padre) -- se tira la tabla hija primero. No se
    # dropean los índices por separado: MySQL/InnoDB no permite quitar un
    # índice que respalda una FK con DROP INDEX suelto; DROP TABLE limpia
    # índices y constraints atómicamente.
    op.drop_table('announcement_reads')
    op.drop_table('announcements')


def downgrade() -> None:
    # Orden corregido a mano: crear primero el padre ('announcements'),
    # luego la hija ('announcement_reads') que tiene la FK hacia él.
    op.create_table('announcements',
    sa.Column('id', mysql.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('titulo', mysql.VARCHAR(length=100), nullable=False),
    sa.Column('cuerpo_md', mysql.TEXT(), nullable=False),
    sa.Column('prioridad', mysql.VARCHAR(length=10), nullable=False),
    sa.Column('anclado', mysql.TINYINT(display_width=1), autoincrement=False, nullable=False),
    sa.Column('alcance_tipo', mysql.VARCHAR(length=10), nullable=False),
    sa.Column('alcance_ids', mysql.JSON(), nullable=True),
    sa.Column('autor_id', mysql.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('publicado_at', mysql.DATETIME(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.Column('expira_at', mysql.DATETIME(), nullable=True),
    sa.Column('activo', mysql.TINYINT(display_width=1), autoincrement=False, nullable=False),
    sa.Column('created_at', mysql.DATETIME(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.Column('updated_at', mysql.DATETIME(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.ForeignKeyConstraint(['autor_id'], ['users.id'], name='announcements_ibfk_1'),
    sa.PrimaryKeyConstraint('id'),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.create_index('ix_announcements_activo_anclado', 'announcements', ['activo', 'anclado'], unique=False)
    op.create_table('announcement_reads',
    sa.Column('id', mysql.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('announcement_id', mysql.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('user_id', mysql.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('read_at', mysql.DATETIME(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    sa.ForeignKeyConstraint(['announcement_id'], ['announcements.id'], name='announcement_reads_ibfk_1', ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='announcement_reads_ibfk_2'),
    sa.PrimaryKeyConstraint('id'),
    mysql_collate='utf8mb4_0900_ai_ci',
    mysql_default_charset='utf8mb4',
    mysql_engine='InnoDB'
    )
    op.create_index('ix_announcement_reads_unique', 'announcement_reads', ['announcement_id', 'user_id'], unique=True)
