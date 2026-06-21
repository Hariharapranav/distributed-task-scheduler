import structlog
from sqlalchemy import create_engine, update, select
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.task import Task
from app.models.execution import TaskExecution
from app.models.notification import NotificationRule, NotificationLog

logger = structlog.get_logger()


def _get_session():
    engine = create_engine(settings.SYNC_DATABASE_URL)
    return Session(engine), engine


async def handle_task_event(event: dict):
    """Process task.events messages: update execution status, trigger notifications."""
    event_type = event.get("event_type")  # success | failed | retrying
    task_id = event.get("task_id")
    execution_id = event.get("execution_id")

    logger.info("handling_task_event", event_type=event_type, task_id=task_id)

    session, engine = _get_session()
    try:
        # Fetch task name for notification message
        task = session.get(Task, task_id)
        if not task:
            return

        # Find matching notification rules (task-specific or global)
        rules = session.execute(
            select(NotificationRule).where(
                NotificationRule.user_id == task.owner_id,
                NotificationRule.is_enabled == True,
                (NotificationRule.task_id == task_id) | (NotificationRule.task_id == None),
            )
        ).scalars().all()

        for rule in rules:
            should_notify = (
                (event_type == "success" and rule.notify_on_success) or
                (event_type == "failed" and rule.notify_on_failure) or
                (event_type == "retrying" and rule.notify_on_retry)
            )
            if not should_notify:
                continue

            # Dispatch notification
            try:
                from consumer.handlers.notification_handler import dispatch
                await dispatch(rule, task_id=task_id, task_name=task.name,
                               execution_id=execution_id, event_type=event_type,
                               details={"duration_ms": event.get("duration_ms", "N/A")})

                # Log success
                log = NotificationLog(
                    rule_id=rule.id,
                    execution_id=execution_id,
                    task_id=task_id,
                    status="sent",
                    channel=rule.channel,
                    message=f"Notification sent for {event_type} event",
                )
                session.add(log)
            except Exception as exc:
                log = NotificationLog(
                    rule_id=rule.id,
                    execution_id=execution_id,
                    task_id=task_id,
                    status="failed",
                    channel=rule.channel,
                    error=str(exc),
                )
                session.add(log)

        session.commit()
    finally:
        session.close()
        engine.dispose()
