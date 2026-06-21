from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.notification import NotificationRule, NotificationLog
from app.schemas.notification import (
    NotificationRuleCreateRequest,
    NotificationRuleUpdateRequest,
    NotificationRuleResponse,
    NotificationLogResponse,
)

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/rules", response_model=List[NotificationRuleResponse])
async def list_rules(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(NotificationRule)
        .where(NotificationRule.user_id == current_user.id)
        .order_by(desc(NotificationRule.created_at))
    )
    return [NotificationRuleResponse.model_validate(r) for r in result.scalars().all()]


@router.post("/rules", response_model=NotificationRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_rule(
    data: NotificationRuleCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rule = NotificationRule(
        user_id=current_user.id,
        task_id=data.task_id,
        name=data.name,
        channel=data.channel,
        notify_on_success=data.notify_on_success,
        notify_on_failure=data.notify_on_failure,
        notify_on_retry=data.notify_on_retry,
        channel_config=data.channel_config,
    )
    db.add(rule)
    await db.flush()
    return NotificationRuleResponse.model_validate(rule)


@router.patch("/rules/{rule_id}", response_model=NotificationRuleResponse)
async def update_rule(
    rule_id: str,
    data: NotificationRuleUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(NotificationRule).where(
            NotificationRule.id == rule_id, NotificationRule.user_id == current_user.id
        )
    )
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(rule, field, value)
    return NotificationRuleResponse.model_validate(rule)


@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rule(
    rule_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(NotificationRule).where(
            NotificationRule.id == rule_id, NotificationRule.user_id == current_user.id
        )
    )
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    await db.delete(rule)


@router.get("/logs", response_model=List[NotificationLogResponse])
async def list_logs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(NotificationLog)
        .join(NotificationRule, NotificationLog.rule_id == NotificationRule.id)
        .where(NotificationRule.user_id == current_user.id)
        .order_by(desc(NotificationLog.sent_at))
        .limit(100)
    )
    return [NotificationLogResponse.model_validate(log) for log in result.scalars().all()]
