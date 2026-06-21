from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field, field_validator
import re


# ─────────────────────────────────────────────
#  Task Schemas
# ─────────────────────────────────────────────

class TaskCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    tags: Optional[List[str]] = []

    # Payload
    task_type: str = Field("http", pattern="^(http|shell)$")
    # HTTP
    http_method: Optional[str] = Field("POST", pattern="^(GET|POST|PUT|PATCH|DELETE)$")
    http_url: Optional[str] = None
    http_headers: Optional[Dict[str, str]] = {}
    http_body: Optional[Dict[str, Any]] = {}
    http_timeout: int = Field(30, ge=1, le=300)
    # Shell
    shell_command: Optional[str] = None
    shell_timeout: int = Field(60, ge=1, le=600)

    # Schedule
    schedule_type: str = Field("manual", pattern="^(manual|cron|interval|one_time)$")
    cron_expression: Optional[str] = None
    interval_seconds: Optional[int] = Field(None, ge=10)
    run_at: Optional[datetime] = None

    # Retry
    max_retries: int = Field(3, ge=0, le=10)
    retry_delay_seconds: int = Field(60, ge=1, le=3600)

    @field_validator("cron_expression")
    @classmethod
    def validate_cron(cls, v, info):
        if v and info.data.get("schedule_type") == "cron":
            parts = v.strip().split()
            if len(parts) != 5:
                raise ValueError("Cron expression must have exactly 5 fields")
        return v


class TaskUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    http_method: Optional[str] = None
    http_url: Optional[str] = None
    http_headers: Optional[Dict[str, str]] = None
    http_body: Optional[Dict[str, Any]] = None
    http_timeout: Optional[int] = None
    shell_command: Optional[str] = None
    schedule_type: Optional[str] = None
    cron_expression: Optional[str] = None
    interval_seconds: Optional[int] = None
    run_at: Optional[datetime] = None
    max_retries: Optional[int] = None
    retry_delay_seconds: Optional[int] = None
    is_enabled: Optional[bool] = None


class TaskResponse(BaseModel):
    id: str
    owner_id: str
    name: str
    description: Optional[str]
    tags: Optional[List[str]]
    task_type: str
    http_method: Optional[str]
    http_url: Optional[str]
    http_headers: Optional[Dict[str, str]]
    http_body: Optional[Dict[str, Any]]
    http_timeout: int
    shell_command: Optional[str]
    shell_timeout: int
    schedule_type: str
    cron_expression: Optional[str]
    interval_seconds: Optional[int]
    run_at: Optional[datetime]
    max_retries: int
    retry_delay_seconds: int
    is_enabled: bool
    created_at: datetime
    updated_at: datetime
    last_run_at: Optional[datetime]
    next_run_at: Optional[datetime]
    execution_count: Optional[int] = 0
    success_count: Optional[int] = 0
    failure_count: Optional[int] = 0

    model_config = {"from_attributes": True}


class TaskListResponse(BaseModel):
    items: List[TaskResponse]
    total: int
    page: int
    page_size: int
    pages: int
