from datetime import datetime, timezone
from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update, delete
from sqlalchemy.orm import selectinload
import structlog

from app.models.task import Task
from app.models.execution import TaskExecution
from app.schemas.task import TaskCreateRequest, TaskUpdateRequest
from worker.celery_app import celery_app

logger = structlog.get_logger()


async def create_task(
    db: AsyncSession, owner_id: str, data: TaskCreateRequest
) -> Task:
    task = Task(
        owner_id=owner_id,
        name=data.name,
        description=data.description,
        tags=data.tags,
        task_type=data.task_type,
        http_method=data.http_method,
        http_url=data.http_url,
        http_headers=data.http_headers,
        http_body=data.http_body,
        http_timeout=data.http_timeout,
        shell_command=data.shell_command,
        shell_timeout=data.shell_timeout,
        schedule_type=data.schedule_type,
        cron_expression=data.cron_expression,
        interval_seconds=data.interval_seconds,
        run_at=data.run_at,
        max_retries=data.max_retries,
        retry_delay_seconds=data.retry_delay_seconds,
    )
    db.add(task)
    await db.flush()

    logger.info("task_created", task_id=task.id, schedule=data.schedule_type)
    return task



async def get_task(db: AsyncSession, task_id: str, owner_id: str) -> Optional[Task]:
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.owner_id == owner_id)
    )
    return result.scalar_one_or_none()


async def list_tasks(
    db: AsyncSession,
    owner_id: str,
    page: int = 1,
    page_size: int = 20,
    status_filter: Optional[str] = None,
) -> Tuple[List[Task], int]:
    query = select(Task).where(Task.owner_id == owner_id).order_by(Task.created_at.desc())
    if status_filter == "enabled":
        query = query.where(Task.is_enabled == True)
    elif status_filter == "disabled":
        query = query.where(Task.is_enabled == False)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    tasks = list(result.scalars().all())
    return tasks, total


async def update_task(
    db: AsyncSession, task: Task, data: TaskUpdateRequest
) -> Task:
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(task, field, value)
    task.updated_at = datetime.now(timezone.utc)
    return task


async def delete_task(db: AsyncSession, task: Task):
    await db.delete(task)


async def trigger_task_now(db: AsyncSession, task: Task) -> TaskExecution:
    """Manually trigger a task execution."""
    execution = TaskExecution(
        task_id=task.id,
        status="pending",
        trigger="manual",
    )
    db.add(execution)
    await db.flush()

    # Dispatch to Celery
    result = celery_app.send_task(
        "worker.tasks.task_runner.run_task",
        args=[task.id, execution.id],
        queue="default",
    )
    execution.celery_task_id = result.id
    task.last_run_at = datetime.now(timezone.utc)

    logger.info("task_triggered_manually", task_id=task.id, execution_id=execution.id)
    return execution


async def get_task_stats(db: AsyncSession, task_id: str) -> dict:
    result = await db.execute(
        select(
            func.count(TaskExecution.id).label("total"),
            func.sum((TaskExecution.status == "success").cast(int)).label("success"),
            func.sum((TaskExecution.status == "failed").cast(int)).label("failed"),
            func.avg(TaskExecution.duration_ms).label("avg_duration"),
        ).where(TaskExecution.task_id == task_id)
    )
    row = result.one()
    return {
        "total": row.total or 0,
        "success": row.success or 0,
        "failed": row.failed or 0,
        "avg_duration_ms": round(row.avg_duration or 0, 2),
    }



