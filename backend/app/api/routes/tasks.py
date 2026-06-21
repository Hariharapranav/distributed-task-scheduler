import math
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.task import TaskCreateRequest, TaskUpdateRequest, TaskResponse, TaskListResponse
from app.schemas.execution import ExecutionResponse
import app.services.task_service as task_service

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.get("", response_model=TaskListResponse)
async def list_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, pattern="^(enabled|disabled)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    tasks, total = await task_service.list_tasks(db, current_user.id, page, page_size, status_filter)
    pages = math.ceil(total / page_size) if total > 0 else 1

    task_responses = []
    for task in tasks:
        stats = await task_service.get_task_stats(db, task.id)
        resp = TaskResponse.model_validate(task)
        resp.execution_count = stats["total"]
        resp.success_count = stats["success"]
        resp.failure_count = stats["failed"]
        task_responses.append(resp)

    return TaskListResponse(items=task_responses, total=total, page=page, page_size=page_size, pages=pages)


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    data: TaskCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task = await task_service.create_task(db, current_user.id, data)
    return TaskResponse.model_validate(task)


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task = await task_service.get_task(db, task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    stats = await task_service.get_task_stats(db, task.id)
    resp = TaskResponse.model_validate(task)
    resp.execution_count = stats["total"]
    resp.success_count = stats["success"]
    resp.failure_count = stats["failed"]
    return resp


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    data: TaskUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task = await task_service.get_task(db, task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task = await task_service.update_task(db, task, data)
    return TaskResponse.model_validate(task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task = await task_service.get_task(db, task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    await task_service.delete_task(db, task)


@router.post("/{task_id}/trigger", response_model=ExecutionResponse, status_code=status.HTTP_202_ACCEPTED)
async def trigger_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task = await task_service.get_task(db, task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if not task.is_enabled:
        raise HTTPException(status_code=400, detail="Task is disabled")
    execution = await task_service.trigger_task_now(db, task)
    return ExecutionResponse.model_validate(execution)
