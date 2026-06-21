import json
import structlog
from typing import Optional
from aiokafka import AIOKafkaProducer
from app.core.config import settings

logger = structlog.get_logger()

_producer: Optional[AIOKafkaProducer] = None


async def get_producer() -> AIOKafkaProducer:
    global _producer
    if _producer is None:
        _producer = AIOKafkaProducer(
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            key_serializer=lambda k: k.encode("utf-8") if k else None,
        )
        await _producer.start()
    return _producer


async def stop_producer():
    global _producer
    if _producer:
        await _producer.stop()
        _producer = None


async def publish_task_event(
    topic: str,
    event_type: str,
    payload: dict,
    key: Optional[str] = None,
):
    """Publish a structured event to a Kafka topic."""
    producer = await get_producer()
    message = {"event_type": event_type, **payload}
    try:
        await producer.send_and_wait(topic, value=message, key=key)
        logger.info("kafka_event_published", topic=topic, event_type=event_type)
    except Exception as exc:
        logger.error("kafka_publish_failed", topic=topic, error=str(exc))
        raise
