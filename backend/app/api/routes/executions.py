import math
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.task import Task
from app.models.execution import TaskExecution
from app.schemas.execution import ExecutionListResponse, ExecutionResponse, ExecutionStatsResponse

router = APIRouter(prefix="/executions", tags=["Executions"])


@router.get("", response_model=ExecutionListResponse)
async def list_executions(
    task_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Join with Task to enforce ownership
    query = (
        select(TaskExecution)
        .join(Task, TaskExecution.task_id == Task.id)
        .where(Task.owner_id == current_user.id)
        .order_by(desc(TaskExecution.queued_at))
    )
    if task_id:
        query = query.where(TaskExecution.task_id == task_id)
    if status:
        query = query.where(TaskExecution.status == status)

    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar_one()

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    executions = list(result.scalars().all())

    return ExecutionListResponse(
        items=[ExecutionResponse.model_validate(e) for e in executions],
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size) if total > 0 else 1,
    )


@router.get("/stats", response_model=ExecutionStatsResponse)
async def get_stats(
    days: int = Query(7, ge=1, le=90),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    base = (
        select(TaskExecution)
        .join(Task, TaskExecution.task_id == Task.id)
        .where(Task.owner_id == current_user.id, TaskExecution.queued_at >= since)
    )

    stats_q = select(
        func.count(TaskExecution.id).label("total"),
        func.sum((TaskExecution.status == "success").cast(int)).label("success"),
        func.sum((TaskExecution.status == "failed").cast(int)).label("failed"),
        func.sum((TaskExecution.status == "pending").cast(int)).label("pending"),
        func.sum((TaskExecution.status == "running").cast(int)).label("running"),
        func.avg(TaskExecution.duration_ms).label("avg_dur"),
    ).select_from(base.subquery())

    row = (await db.execute(stats_q)).one()
    total = row.total or 0
    success = row.success or 0

    return ExecutionStatsResponse(
        total_executions=total,
        success_count=success,
        failure_count=row.failed or 0,
        pending_count=row.pending or 0,
        running_count=row.running or 0,
        avg_duration_ms=round(row.avg_dur or 0, 2),
        success_rate=round((success / total * 100) if total > 0 else 0, 2),
        executions_per_day=[],  # populated by a separate query in production
    )


@router.get("/{execution_id}", response_model=ExecutionResponse)
async def get_execution(
    execution_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from fastapi import HTTPException
    result = await db.execute(
        select(TaskExecution)
        .join(Task, TaskExecution.task_id == Task.id)
        .where(TaskExecution.id == execution_id, Task.owner_id == current_user.id)
    )
    execution = result.scalar_one_or_none()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    return ExecutionResponse.model_validate(execution)
