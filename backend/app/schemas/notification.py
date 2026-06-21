from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class NotificationRuleCreateRequest(BaseModel):
    task_id: Optional[str] = None
    name: str = Field(..., min_length=1, max_length=200)
    channel: str = Field(..., pattern="^(email|webhook)$")
    notify_on_success: bool = False
    notify_on_failure: bool = True
    notify_on_retry: bool = False
    channel_config: Dict[str, Any] = Field(...)
    # email: {"email": "user@example.com"}
    # webhook: {"url": "https://...", "method": "POST", "secret": "..."}


class NotificationRuleUpdateRequest(BaseModel):
    name: Optional[str] = None
    notify_on_success: Optional[bool] = None
    notify_on_failure: Optional[bool] = None
    notify_on_retry: Optional[bool] = None
    channel_config: Optional[Dict[str, Any]] = None
    is_enabled: Optional[bool] = None


class NotificationRuleResponse(BaseModel):
    id: str
    user_id: str
    task_id: Optional[str]
    name: str
    channel: str
    notify_on_success: bool
    notify_on_failure: bool
    notify_on_retry: bool
    is_enabled: bool
    channel_config: Dict[str, Any]
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationLogResponse(BaseModel):
    id: str
    rule_id: str
    execution_id: Optional[str]
    task_id: Optional[str]
    status: str
    channel: str
    message: Optional[str]
    error: Optional[str]
    sent_at: datetime

    model_config = {"from_attributes": True}
