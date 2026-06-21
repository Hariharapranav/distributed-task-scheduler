import asyncio
import json
import structlog
from aiokafka import AIOKafkaConsumer
from app.core.config import settings
from consumer.handlers.task_event_handler import handle_task_event
from consumer.handlers.notification_handler import handle_notification
from consumer.handlers.audit_handler import handle_audit

logger = structlog.get_logger()


async def consume():
    consumer = AIOKafkaConsumer(
        settings.KAFKA_TOPIC_TASK_EVENTS,
        settings.KAFKA_TOPIC_NOTIFICATIONS,
        settings.KAFKA_TOPIC_AUDIT,
        bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
        group_id=settings.KAFKA_GROUP_ID,
        value_deserializer=lambda v: json.loads(v.decode("utf-8")),
        auto_offset_reset="latest",
        enable_auto_commit=True,
    )

    await consumer.start()
    logger.info("kafka_consumer_started", topics=[
        settings.KAFKA_TOPIC_TASK_EVENTS,
        settings.KAFKA_TOPIC_NOTIFICATIONS,
        settings.KAFKA_TOPIC_AUDIT,
    ])

    try:
        async for message in consumer:
            topic = message.topic
            event = message.value
            logger.info("kafka_message_received", topic=topic, event_type=event.get("event_type"))

            try:
                if topic == settings.KAFKA_TOPIC_TASK_EVENTS:
                    await handle_task_event(event)
                elif topic == settings.KAFKA_TOPIC_NOTIFICATIONS:
                    await handle_notification(event)
                elif topic == settings.KAFKA_TOPIC_AUDIT:
                    await handle_audit(event)
            except Exception as exc:
                logger.error("event_handler_error", topic=topic, error=str(exc))
    finally:
        await consumer.stop()
        logger.info("kafka_consumer_stopped")


if __name__ == "__main__":
    asyncio.run(consume())
