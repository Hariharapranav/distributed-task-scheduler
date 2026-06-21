import structlog
from app.models.notification import NotificationRule
from app.services.notification_service import send_email_notification, send_webhook_notification

logger = structlog.get_logger()


async def dispatch(
    rule: NotificationRule,
    task_id: str,
    task_name: str,
    execution_id: str,
    event_type: str,
    details: dict,
):
    """Dispatch notification via the channel configured in the rule."""
    config = rule.channel_config

    if rule.channel == "email":
        email = config.get("email")
        if not email:
            raise ValueError("Missing email in channel_config")
        await send_email_notification(
            to_email=email,
            task_name=task_name,
            event_type=event_type,
            execution_id=execution_id,
            details=details,
        )

    elif rule.channel == "webhook":
        url = config.get("url")
        if not url:
            raise ValueError("Missing url in channel_config")
        await send_webhook_notification(
            url=url,
            method=config.get("method", "POST"),
            payload={
                "event_type": event_type,
                "task_id": task_id,
                "task_name": task_name,
                "execution_id": execution_id,
                **details,
            },
            secret=config.get("secret"),
        )
    else:
        raise ValueError(f"Unknown notification channel: {rule.channel}")


async def handle_notification(event: dict):
    """Handle messages from the notifications Kafka topic."""
    logger.info("handle_notification_event", event=event)
    # Additional notification routing logic if needed
