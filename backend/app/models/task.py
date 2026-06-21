import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Boolean, DateTime, Text, Integer, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Identity
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tags: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True, default=list)

    # Task payload
    task_type: Mapped[str] = mapped_column(String(20), nullable=False, default="http")
    # For HTTP tasks
    http_method: Mapped[Optional[str]] = mapped_column(String(10), nullable=True, default="POST")
    http_url: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    http_headers: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True, default=dict)
    http_body: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True, default=dict)
    http_timeout: Mapped[int] = mapped_column(Integer, default=30)
    # For shell tasks
    shell_command: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    shell_timeout: Mapped[int] = mapped_column(Integer, default=60)

    # Scheduling
    schedule_type: Mapped[str] = mapped_column(String(20), nullable=False, default="manual")
    cron_expression: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    interval_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    run_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Retry
    max_retries: Mapped[int] = mapped_column(Integer, default=3)
    retry_delay_seconds: Mapped[int] = mapped_column(Integer, default=60)

    # State
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    celery_task_id: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    last_run_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    next_run_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="tasks")
    executions: Mapped[list["TaskExecution"]] = relationship(
        "TaskExecution", back_populates="task", lazy="selectin", cascade="all, delete-orphan"
    )
    notification_rules: Mapped[list["NotificationRule"]] = relationship(
        "NotificationRule", back_populates="task", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Task id={self.id} name={self.name} type={self.task_type}>"
