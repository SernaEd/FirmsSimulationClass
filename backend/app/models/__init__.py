"""Registro de modelos para que Alembic los detecte con --autogenerate.

Cada dominio agrega sus modelos aquí. Actualmente:
- Dominio 1 (Users + Auth): User
- Dominio 2 (Teams): Team, TeamMember, TeamNameProposal
- Dominio 3 (Economía): PrivilegeCatalog, PrivilegeTicket, SplitBillContribution,
  TokenLedger, DecimalRedemptionRequest
- Dominio 4 (Sistema): InboxItem, SystemFlag, SystemState
  (Announcement/AnnouncementRead se removieron — anuncios ahora se publican
  en Brightspace, ver plan_de_tareas_mvp.md)
- Iteración 1 (Test de perfil): ProfileTestQuestion, ProfileTestAnswer
- Iteración 1 (Contenido): Module, CourseSession, ForumPost, SessionAttachment
- Iteración 1 (Racha): StreakDay, StreakEvidence
- Licitaciones (§10, §12.6): Caso, Licitacion, LicitacionResponse
"""

from .content import CourseSession, ForumPost, Module, SessionAttachment  # noqa: F401
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
from .licitaciones import (  # noqa: F401
    Caso,
    EstadoLicitacion,
    Licitacion,
    LicitacionResponse,
    TipoModeloCaso,
)
from .profile_test import ProfileTestAnswer, ProfileTestQuestion  # noqa: F401
from .streak import StreakDay, StreakDayStatus, StreakEvidence  # noqa: F401
from .system import (  # noqa: F401
    InboxItem,
    InboxItemStatus,
    InboxItemType,
    InboxPriority,
    SystemFlag,
    SystemState,
)
from .team import ProposalStatus, Team, TeamMember, TeamNameProposal, TeamNameStatus  # noqa: F401
from .user import User, UserProfile, UserPronouns, UserStatus  # noqa: F401
