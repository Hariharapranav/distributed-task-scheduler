from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "task_scheduler",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["worker.tasks.task_runner", "worker.tasks.notification_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_routes={
        "worker.tasks.task_runner.run_task": {"queue": "default"},
        "worker.tasks.notification_tasks.*": {"queue": "default"},
    },
    task_default_queue="default",
    result_expires=86400,  # 24h
    beat_schedule={},  # Populated dynamically from DB at startup
)
