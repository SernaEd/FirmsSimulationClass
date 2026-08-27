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
from app.models.system import InboxItem, InboxItemType, InboxPriority
from app.services.inbox import create_inbox_item
from app.services.streak import is_racha_day, mark_neutral_for_active_users
from app.services.tokens import consume_ticket_by_folio

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

def evaluate_streaks_job():
    """Evalúa la racha a medianoche para los alumnos activos."""
    logger.info("Iniciando evaluación de racha nocturna...")
    with SessionLocal() as db:
        # Fecha de ayer (la que estamos evaluando)
        yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).date()

        if not is_racha_day(db, yesterday):
            # Viernes-domingo, o un día marcado en el calendario académico
            # (§11.5) -- neutro para todos, no rompe ni exige evidencia.
            affected = mark_neutral_for_active_users(db, yesterday)
            logger.info(f"{yesterday} no cuenta para la racha (fin de semana o festivo) -- {affected} alumnos marcados neutro.")
            return

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


def detect_inactivity_job():
    """Detecta alumnos inactivos (§11.1, §12.4): sin login y sin racha
    completada (ni pase aplicado) en los últimos 14 días. El plan pide un
    tercer criterio, "sin entregas" -- queda fuera hasta que exista el
    modelo de Entregas (Iteración 3); no hay nada que consultar todavía.
    Encola una sola alerta de sistema en el Inbox con la lista completa
    (no una por alumno) para no inundarlo cada semana.
    """
    logger.info("Iniciando detección de inactividad...")
    with SessionLocal() as db:
        cutoff = datetime.now(timezone.utc) - timedelta(days=14)
        cutoff_date = cutoff.date()

        active_users = db.scalars(select(User).where(User.estado == UserStatus.active)).all()
        inactive = []
        for user in active_users:
            if user.last_login_at is not None and user.last_login_at >= cutoff:
                continue
            recent_completado = db.scalar(
                select(StreakDay.id)
                .where(
                    StreakDay.user_id == user.id,
                    StreakDay.fecha >= cutoff_date,
                    StreakDay.estado.in_([StreakDayStatus.completado, StreakDayStatus.pase_aplicado]),
                )
                .limit(1)
            )
            if recent_completado is not None:
                continue
            inactive.append(user)

        if not inactive:
            logger.info("Detección de inactividad: sin alumnos inactivos.")
            return

        create_inbox_item(
            db,
            tipo=InboxItemType.alerta_inactividad,
            referencia_id=None,
            prioridad=InboxPriority.media,
            payload={
                "detectado_en": datetime.now(timezone.utc).isoformat(),
                "umbral_dias": 14,
                "alumnos": [
                    {"user_id": u.id, "nombre": f"{u.nombre} {u.apellidos}", "numero_cuenta": u.numero_cuenta}
                    for u in inactive
                ],
            },
        )
        db.commit()
        logger.info(f"Detección de inactividad: {len(inactive)} alumnos marcados, alerta creada en el Inbox.")


def start_scheduler():
    scheduler.add_job(
        evaluate_streaks_job,
        trigger=CronTrigger(hour=0, minute=5), # 5 minutos pasada la medianoche
        id="evaluate_streaks",
        replace_existing=True,
    )
    scheduler.add_job(
        detect_inactivity_job,
        trigger=CronTrigger(day_of_week="mon", hour=6, minute=0),
        id="detect_inactivity",
        replace_existing=True,
    )
    scheduler.start()

def stop_scheduler():
    scheduler.shutdown()
