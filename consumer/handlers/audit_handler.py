import structlog
from datetime import datetime, timezone

logger = structlog.get_logger()


async def handle_audit(event: dict):
    """Write audit log entries from Kafka events to structured logs / DB."""
    logger.info(
        "audit_log",
        event_type=event.get("event_type"),
        task_id=event.get("task_id"),
        execution_id=event.get("execution_id"),
        timestamp=datetime.now(timezone.utc).isoformat(),
        details=event,
    )
