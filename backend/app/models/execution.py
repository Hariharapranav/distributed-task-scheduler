import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, DateTime, Text, Integer, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class TaskExecution(Base):
    __tablename__ = "task_executions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True
    )
    celery_task_id: Mapped[Optional[str]] = mapped_column(String(200), nullable=True, index=True)

    # Status lifecycle: pending → running → success | failed | retrying
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending", index=True)
    trigger: Mapped[str] = mapped_column(String(20), nullable=False, default="scheduled")  # scheduled | manual | retry

    # Timing
    queued_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Result
    result: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    http_status_code: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    task: Mapped["Task"] = relationship("Task", back_populates="executions")

    def __repr__(self) -> str:
        return f"<TaskExecution id={self.id} task_id={self.task_id} status={self.status}>"
