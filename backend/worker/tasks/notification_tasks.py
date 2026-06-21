import asyncio
import structlog
from worker.celery_app import celery_app
from app.services.notification_service import send_email_notification, send_webhook_notification

logger = structlog.get_logger()


def _run_sync(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(name="worker.tasks.notification_tasks.dispatch_email")
def dispatch_email(to_email: str, task_name: str, event_type: str, execution_id: str, details: dict):
    """Fallback Celery task for sending email notifications."""
    result = _run_sync(
        send_email_notification(to_email, task_name, event_type, execution_id, details)
    )
    logger.info("email_dispatch_result", to=to_email, success=result)
    return result


@celery_app.task(name="worker.tasks.notification_tasks.dispatch_webhook")
def dispatch_webhook(url: str, method: str, payload: dict, secret: str = None):
    """Fallback Celery task for webhook notifications."""
    result = _run_sync(send_webhook_notification(url, method, payload, secret))
    logger.info("webhook_dispatch_result", url=url, success=result)
    return result
