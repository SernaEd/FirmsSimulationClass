"""Registro de modelos para que Alembic los detecte con --autogenerate.

Cada dominio agrega sus modelos aquí. Actualmente:
- Dominio 1 (Users + Auth): User
- Dominio 2 (Teams): Team, TeamMember, TeamNameProposal
"""

from .team import ProposalStatus, Team, TeamMember, TeamNameProposal, TeamNameStatus  # noqa: F401
from .user import User, UserProfile, UserPronouns, UserStatus  # noqa: F401
