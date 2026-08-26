"""licitaciones_casos_y_respuestas

Revision ID: 088ee53fe24c
Revises: f4a2d8c19e6b
Create Date: 2026-08-26 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '088ee53fe24c'
down_revision: Union[str, None] = 'f4a2d8c19e6b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('casos',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('numero', sa.Integer(), nullable=False),
    sa.Column('titulo', sa.String(length=200), nullable=False),
    sa.Column('modulo', sa.String(length=200), nullable=False),
    sa.Column('contexto', sa.Text(), nullable=False),
    sa.Column('tipo_modelo', sa.Enum('mezcla_lineal_tanque', name='tipomodelocaso', native_enum=False, length=30), nullable=False),
    sa.Column('volumen_l', sa.Float(), nullable=False),
    sa.Column('concentracion_inicial', sa.Float(), nullable=False),
    sa.Column('concentracion_max', sa.Float(), nullable=False),
    sa.Column('plazo_horas', sa.Float(), nullable=False),
    sa.Column('presion_max_q', sa.Float(), nullable=False),
    sa.Column('dinero_perdido_mxn', sa.Float(), nullable=False),
    sa.Column('pacientes_afectados', sa.Integer(), nullable=False),
    sa.Column('costo_reparacion_mxn', sa.Float(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('numero')
    )
    op.create_table('licitaciones',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('caso_id', sa.Integer(), nullable=False),
    sa.Column('estado', sa.Enum('abierta', 'cerrada', name='estadolicitacion', native_enum=False, length=20), nullable=False),
    sa.Column('pts_primero', sa.Integer(), nullable=False),
    sa.Column('pts_segundo', sa.Integer(), nullable=False),
    sa.Column('pts_tercero', sa.Integer(), nullable=False),
    sa.Column('pts_correcta_fuera_podio', sa.Integer(), nullable=False),
    sa.Column('pts_participacion', sa.Integer(), nullable=False),
    sa.Column('abierta_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('cerrada_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_by', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['caso_id'], ['casos.id'], ),
    sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_licitaciones_estado'), 'licitaciones', ['estado'], unique=False)
    op.create_table('licitacion_responses',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('licitacion_id', sa.Integer(), nullable=False),
    sa.Column('team_id', sa.Integer(), nullable=False),
    sa.Column('submitted_by', sa.Integer(), nullable=False),
    sa.Column('q_propuesta', sa.Float(), nullable=False),
    sa.Column('resultado', sa.JSON(), nullable=False),
    sa.Column('correcta', sa.Boolean(), nullable=False),
    sa.Column('orden_llegada', sa.Integer(), nullable=True),
    sa.Column('puntos_tokens', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['licitacion_id'], ['licitaciones.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['submitted_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['team_id'], ['teams.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('licitacion_id', 'team_id', name='uq_licitacion_response_team')
    )
    op.create_index(op.f('ix_licitacion_responses_created_at'), 'licitacion_responses', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_licitacion_responses_created_at'), table_name='licitacion_responses')
    op.drop_table('licitacion_responses')
    op.drop_index(op.f('ix_licitaciones_estado'), table_name='licitaciones')
    op.drop_table('licitaciones')
    op.drop_table('casos')
