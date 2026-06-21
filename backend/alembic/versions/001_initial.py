"""Initial migration - create all tables

Revision ID: 001_initial
Revises:
Create Date: 2024-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # users
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("username", sa.String(100), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(200), nullable=True),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("is_superuser", sa.Boolean(), default=False),
        sa.Column("created_at", sa.DateTime(timezone=True)),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_username", "users", ["username"])

    # tasks
    op.create_table(
        "tasks",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("owner_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("tags", sa.JSON, nullable=True),
        sa.Column("task_type", sa.String(20), nullable=False),
        sa.Column("http_method", sa.String(10), nullable=True),
        sa.Column("http_url", sa.String(2048), nullable=True),
        sa.Column("http_headers", sa.JSON, nullable=True),
        sa.Column("http_body", sa.JSON, nullable=True),
        sa.Column("http_timeout", sa.Integer(), default=30),
        sa.Column("shell_command", sa.Text, nullable=True),
        sa.Column("shell_timeout", sa.Integer(), default=60),
        sa.Column("schedule_type", sa.String(20), nullable=False),
        sa.Column("cron_expression", sa.String(100), nullable=True),
        sa.Column("interval_seconds", sa.Integer(), nullable=True),
        sa.Column("run_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("max_retries", sa.Integer(), default=3),
        sa.Column("retry_delay_seconds", sa.Integer(), default=60),
        sa.Column("is_enabled", sa.Boolean(), default=True),
        sa.Column("celery_task_id", sa.String(200), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True)),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
        sa.Column("last_run_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("next_run_at", sa.DateTime(timezone=True), nullable=True),
    )

    # task_executions
    op.create_table(
        "task_executions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("task_id", sa.String(36), sa.ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("celery_task_id", sa.String(200), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, default="pending"),
        sa.Column("trigger", sa.String(20), nullable=False, default="scheduled"),
        sa.Column("queued_at", sa.DateTime(timezone=True)),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("duration_ms", sa.Float(), nullable=True),
        sa.Column("result", sa.JSON, nullable=True),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("http_status_code", sa.Integer(), nullable=True),
        sa.Column("retry_count", sa.Integer(), default=0),
    )
    op.create_index("ix_task_executions_task_id", "task_executions", ["task_id"])
    op.create_index("ix_task_executions_status", "task_executions", ["status"])

    # notification_rules
    op.create_table(
        "notification_rules",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("task_id", sa.String(36), sa.ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("channel", sa.String(20), nullable=False),
        sa.Column("notify_on_success", sa.Boolean(), default=False),
        sa.Column("notify_on_failure", sa.Boolean(), default=True),
        sa.Column("notify_on_retry", sa.Boolean(), default=False),
        sa.Column("is_enabled", sa.Boolean(), default=True),
        sa.Column("channel_config", sa.JSON, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True)),
    )

    # notification_logs
    op.create_table(
        "notification_logs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("rule_id", sa.String(36), sa.ForeignKey("notification_rules.id", ondelete="CASCADE"), nullable=False),
        sa.Column("execution_id", sa.String(36), nullable=True),
        sa.Column("task_id", sa.String(36), nullable=True),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("channel", sa.String(20), nullable=False),
        sa.Column("message", sa.Text, nullable=True),
        sa.Column("error", sa.Text, nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_notification_logs_rule_id", "notification_logs", ["rule_id"])


def downgrade() -> None:
    op.drop_table("notification_logs")
    op.drop_table("notification_rules")
    op.drop_table("task_executions")
    op.drop_table("tasks")
    op.drop_table("users")
