"""iter1_attachment_preview

Agrega `preview_path` a session_attachments: ruta al PDF que LibreOffice
genera al subir un PPT/PPTX (ver app/services/content.py,
_convert_to_pdf_preview), servido por el nuevo endpoint
GET /sessions/{id}/attachments/{id}/preview. Los PDF ya subidos se
previsualizan a sí mismos y no usan esta columna.

Revision ID: f4a2d8c19e6b
Revises: a1c3f6e29b7d
Create Date: 2026-08-25 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'f4a2d8c19e6b'
down_revision: Union[str, None] = 'a1c3f6e29b7d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('session_attachments', sa.Column('preview_path', sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column('session_attachments', 'preview_path')
