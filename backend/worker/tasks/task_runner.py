import asyncio
import subprocess
from datetime import datetime, timezone
from typing import Optional
import httpx
import structlog

from worker.celery_app import celery_app
from app.core.config import settings

logger = structlog.get_logger()


def _run_sync(coro):
    """Run an async coroutine from sync Celery task context."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


async def _update_execution(execution_id: str, **fields):
    """Update an execution record in the DB."""
    from sqlalchemy import create_engine, update
    from sqlalchemy.orm import Session
    from app.models.execution import TaskExecution

    from sqlalchemy import create_engine as sync_engine_create
    engine = sync_engine_create(settings.SYNC_DATABASE_URL)
    with Session(engine) as session:
        session.execute(
            update(TaskExecution).where(TaskExecution.id == execution_id).values(**fields)
        )
        session.commit()
    engine.dispose()


async def _get_task_and_execution(task_id: str, execution_id: Optional[str]):
    """Fetch task and (optionally) execution from DB."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session
    from app.models.task import Task
    from app.models.execution import TaskExecution

    engine = create_engine(settings.SYNC_DATABASE_URL)
    with Session(engine) as session:
        task = session.get(Task, task_id)
        execution = session.get(TaskExecution, execution_id) if execution_id else None
    engine.dispose()
    return task, execution


async def _publish_event(event_type: str, task_id: str, execution_id: str, extra: dict):
    try:
        from app.services.kafka_producer import publish_task_event
        await publish_task_event(
            topic=settings.KAFKA_TOPIC_TASK_EVENTS,
            event_type=event_type,
            key=task_id,
            payload={"task_id": task_id, "execution_id": execution_id, **extra},
        )
    except Exception as exc:
        logger.warning("kafka_publish_skipped", error=str(exc))


@celery_app.task(
    name="worker.tasks.task_runner.run_task",
    bind=True,
    max_retries=None,  # controlled by task config
    acks_late=True,
)
def run_task(self, task_id: str, execution_id: Optional[str]):
    """
    Generic task executor. Supports http and shell task types.
    Creates an execution record if one is not provided (scheduled runs).
    """
    from sqlalchemy import create_engine, update
    from sqlalchemy.orm import Session
    from app.models.task import Task
    from app.models.execution import TaskExecution

    engine = create_engine(settings.SYNC_DATABASE_URL)
    started_at = datetime.now(timezone.utc)

    with Session(engine) as session:
        task = session.get(Task, task_id)
        if not task:
            logger.error("task_not_found", task_id=task_id)
            return

        # Create execution record for scheduled runs
        if not execution_id:
            execution = TaskExecution(
                task_id=task_id,
                celery_task_id=self.request.id,
                status="running",
                trigger="scheduled",
                started_at=started_at,
            )
            session.add(execution)
            session.flush()
            execution_id = execution.id
        else:
            session.execute(
                update(TaskExecution)
                .where(TaskExecution.id == execution_id)
                .values(status="running", started_at=started_at, celery_task_id=self.request.id)
            )
        session.commit()

    logger.info("task_execution_started", task_id=task_id, execution_id=execution_id)

    # ── Execute based on task type ──────────────────────────────────
    result = {}
    error_message = None
    http_status_code = None
    status = "success"

    try:
        with Session(engine) as session:
            task = session.get(Task, task_id)

        if task.task_type == "http":
            response = httpx.request(
                method=task.http_method or "POST",
                url=task.http_url,
                headers=task.http_headers or {},
                json=task.http_body or {},
                timeout=task.http_timeout,
            )
            http_status_code = response.status_code
            result = {"status_code": response.status_code, "body": response.text[:4000]}
            if not response.is_success:
                raise Exception(f"HTTP {response.status_code}: {response.text[:500]}")

        elif task.task_type == "shell":
            proc = subprocess.run(
                task.shell_command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=task.shell_timeout,
            )
            result = {"stdout": proc.stdout[:4000], "stderr": proc.stderr[:2000], "returncode": proc.returncode}
            if proc.returncode != 0:
                raise Exception(f"Shell exited with code {proc.returncode}: {proc.stderr[:200]}")

    except Exception as exc:
        error_message = str(exc)
        status = "failed"
        logger.error("task_execution_failed", task_id=task_id, error=error_message)

        # Retry logic
        with Session(engine) as session:
            task = session.get(Task, task_id)
        if task and self.request.retries < task.max_retries:
            _run_sync(
                _update_execution(
                    execution_id, status="retrying", error_message=error_message, retry_count=self.request.retries + 1
                )
            )
            raise self.retry(exc=exc, countdown=task.retry_delay_seconds)

    # ── Record result ───────────────────────────────────────────────
    finished_at = datetime.now(timezone.utc)
    duration_ms = (finished_at - started_at).total_seconds() * 1000

    _run_sync(
        _update_execution(
            execution_id,
            status=status,
            finished_at=finished_at,
            duration_ms=duration_ms,
            result=result,
            error_message=error_message,
            http_status_code=http_status_code,
        )
    )

    # Update task last_run_at
    with Session(engine) as session:
        session.execute(
            update(Task).where(Task.id == task_id).values(last_run_at=finished_at)
        )
        session.commit()

    # Publish event to Kafka
    _run_sync(_publish_event(status, task_id, execution_id, {"duration_ms": duration_ms}))

    engine.dispose()
    logger.info("task_execution_complete", task_id=task_id, status=status, duration_ms=duration_ms)
    return {"status": status, "execution_id": execution_id}


@celery_app.task(name="worker.tasks.task_runner.check_and_trigger_schedules")
def check_and_trigger_schedules():
    """
    Periodic task running on Celery Beat.
    Checks the database for tasks that are due to execute and triggers them.
    """
    from datetime import datetime, timezone, timedelta
    from sqlalchemy import create_engine, select, update
    from sqlalchemy.orm import Session
    from app.models.task import Task
    from app.models.execution import TaskExecution
    from croniter import croniter

    engine = create_engine(settings.SYNC_DATABASE_URL)
    now = datetime.now(timezone.utc)

    with Session(engine) as session:
        # Fetch enabled, scheduled tasks
        stmt = select(Task).where(
            Task.is_enabled == True,
            Task.schedule_type != "manual"
        )
        tasks = session.execute(stmt).scalars().all()

        for task in tasks:
            due = False

            try:
                if task.schedule_type == "interval" and task.interval_seconds:
                    if not task.last_run_at:
                        due = True
                    else:
                        diff = (now - task.last_run_at.replace(tzinfo=timezone.utc)).total_seconds()
                        if diff >= task.interval_seconds:
                            due = True

                elif task.schedule_type == "one_time" and task.run_at:
                    if not task.last_run_at and now >= task.run_at.replace(tzinfo=timezone.utc):
                        due = True

                elif task.schedule_type == "cron" and task.cron_expression:
                    base = task.last_run_at.replace(tzinfo=timezone.utc) if task.last_run_at else (now - timedelta(minutes=10))
                    iter = croniter(task.cron_expression, base)
                    next_run = iter.get_next(datetime)
                    if now >= next_run.replace(tzinfo=timezone.utc):
                        due = True
            except Exception as exc:
                logger.error("schedule_evaluation_failed", task_id=task.id, error=str(exc))

            if due:
                # Create execution record
                execution = TaskExecution(
                    task_id=task.id,
                    status="pending",
                    trigger="scheduled",
                )
                session.add(execution)
                session.flush()

                # Dispatch run_task async
                celery_app.send_task(
                    "worker.tasks.task_runner.run_task",
                    args=[task.id, execution.id],
                    queue="default",
                )

                # Update task last_run_at
                task.last_run_at = now
                logger.info("scheduled_task_triggered", task_id=task.id, name=task.name)

        session.commit()
    engine.dispose()

