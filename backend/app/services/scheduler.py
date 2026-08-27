import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta

from app.database import SessionLocal
from app.models.user import User, UserStatus
from app.models.streak import StreakDay, StreakDayStatus
from app.models.economy import PrivilegeTicket, TicketStatus
from app.models.system import InboxItem, InboxItemType
from app.services.tokens import consume_ticket_by_folio

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

def evaluate_streaks_job():
    """Evalúa la racha a medianoche para los alumnos activos."""
    logger.info("Iniciando evaluación de racha nocturna...")
    with SessionLocal() as db:
        # Fecha de ayer (la que estamos evaluando)
        yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).date()
        
        # Obtener alumnos activos
        active_users = db.scalars(select(User).where(User.estado == UserStatus.active)).all()
        
        for user in active_users:
            # Buscar si existe el StreakDay de ayer
            streak_day = db.scalar(
                select(StreakDay).where(
                    StreakDay.user_id == user.id,
                    StreakDay.fecha == yesterday
                )
            )
            
            if streak_day and streak_day.estado == StreakDayStatus.completado:
                continue # Todo en orden
                
            if not streak_day:
                # No hay evidencia. Verificar si tiene pase de racha.
                # Buscar un ticket emitido de "Pase de racha adicional"
                # Requiere joins con PrivilegeCatalog
                from app.models.economy import PrivilegeCatalog
                
                pase_ticket = db.scalar(
                    select(PrivilegeTicket)
                    .join(PrivilegeCatalog)
                    .where(
                        PrivilegeTicket.initiator_user_id == user.id,
                        PrivilegeTicket.estado == TicketStatus.emitted,
                        PrivilegeCatalog.nombre == "Pase de racha adicional"
                    )
                )
                
                if pase_ticket:
                    # Consumir el pase
                    pase_ticket.estado = TicketStatus.consumed
                    pase_ticket.consumido_at = datetime.now(timezone.utc)
                    # Fake admin ID for system consumptions? Or leave consumido_por_admin_id = None
                    # consumido_por_admin_id is nullable in DB? Let's check. 
                    # If it's nullable, we leave it. Or set to None.
                    
                    streak_day = StreakDay(
                        user_id=user.id,
                        fecha=yesterday,
                        estado=StreakDayStatus.pase_aplicado
                    )
                    db.add(streak_day)
                    db.commit()
                    logger.info(f"Pase de racha aplicado automáticamente para {user.id}")
                else:
                    # No hay pase. Registrar pendiente_revision y crear alerta
                    streak_day = StreakDay(
                        user_id=user.id,
                        fecha=yesterday,
                        estado=StreakDayStatus.pendiente_revision
                    )
                    db.add(streak_day)
                    db.flush()
                    
                    alerta = InboxItem(
                        tipo=InboxItemType.alerta_inactividad,
                        referencia_id=user.id,
                        payload_json={"fecha": yesterday.isoformat(), "streak_day_id": streak_day.id},
                    )
                    db.add(alerta)
                    db.commit()
                    logger.info(f"Racha fallida (pendiente revisión) para {user.id}")
            
    logger.info("Evaluación de racha completada.")

def start_scheduler():
    scheduler.add_job(
        evaluate_streaks_job,
        trigger=CronTrigger(hour=0, minute=5), # 5 minutos pasada la medianoche
        id="evaluate_streaks",
        replace_existing=True,
    )
    scheduler.start()

def stop_scheduler():
    scheduler.shutdown()
