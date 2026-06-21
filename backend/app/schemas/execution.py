from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field


class ExecutionResponse(BaseModel):
    id: str
    task_id: str
    celery_task_id: Optional[str]
    status: str
    trigger: str
    queued_at: datetime
    started_at: Optional[datetime]
    finished_at: Optional[datetime]
    duration_ms: Optional[float]
    result: Optional[Dict[str, Any]]
    error_message: Optional[str]
    http_status_code: Optional[int]
    retry_count: int

    model_config = {"from_attributes": True}


class ExecutionListResponse(BaseModel):
    items: List[ExecutionResponse]
    total: int
    page: int
    page_size: int
    pages: int


class ExecutionStatsResponse(BaseModel):
    total_executions: int
    success_count: int
    failure_count: int
    pending_count: int
    running_count: int
    avg_duration_ms: Optional[float]
    success_rate: float
    executions_per_day: List[Dict[str, Any]]
