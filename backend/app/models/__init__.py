"""Registro de modelos para que Alembic los detecte con --autogenerate.

Cada dominio agrega sus modelos aquí. Actualmente:
- Dominio 1 (Users + Auth): User
"""

from .user import User, UserProfile, UserPronouns, UserStatus  # noqa: F401
