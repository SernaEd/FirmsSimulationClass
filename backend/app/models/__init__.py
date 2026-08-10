"""Registro de modelos para que Alembic los detecte con --autogenerate.

Cada dominio agrega sus modelos aquí. Actualmente:
- Dominio 1 (Users + Auth): User
- Dominio 2 (Teams): Team, TeamMember, TeamNameProposal
- Dominio 3 (Economía): PrivilegeCatalog, PrivilegeTicket, SplitBillContribution,
  TokenLedger, DecimalRedemptionRequest
- Dominio 4 (Sistema): InboxItem, Announcement, AnnouncementRead, SystemFlag,
  SystemState
"""

from .economy import (  # noqa: F401
    DecimalRedemptionRequest,
    DecimalRequestStatus,
    PrivilegeCatalog,
    PrivilegeTicket,
    SplitBillContribution,
    TicketStatus,
    TokenLedger,
    TokenSource,
)
from .system import (  # noqa: F401
    Announcement,
    AnnouncementPriority,
    AnnouncementRead,
    AnnouncementScope,
    InboxItem,
    InboxItemStatus,
    InboxItemType,
    InboxPriority,
    SystemFlag,
    SystemState,
)
from .team import ProposalStatus, Team, TeamMember, TeamNameProposal, TeamNameStatus  # noqa: F401
from .user import User, UserProfile, UserPronouns, UserStatus  # noqa: F401
