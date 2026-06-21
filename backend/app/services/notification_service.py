import aiosmtplib
import httpx
import structlog
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from app.core.config import settings

logger = structlog.get_logger()


def _build_email_body(event_type: str, task_name: str, execution_id: str, details: dict) -> str:
    status_emoji = {"success": "✅", "failed": "❌", "retrying": "🔄"}.get(event_type, "ℹ️")
    return f"""
    <html><body style="font-family: sans-serif; background: #0f0f1a; color: #e2e8f0; padding: 24px;">
      <div style="max-width: 600px; margin: auto; background: #1a1a2e; border-radius: 12px; padding: 32px; border: 1px solid #2d2d4e;">
        <h2 style="color: #7c3aed;">{status_emoji} Task {event_type.title()}: {task_name}</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <tr><td style="padding: 8px; color: #94a3b8;">Execution ID</td><td style="padding: 8px;">{execution_id}</td></tr>
          <tr><td style="padding: 8px; color: #94a3b8;">Status</td><td style="padding: 8px;">{event_type}</td></tr>
          {''.join(f'<tr><td style="padding: 8px; color: #94a3b8;">{k}</td><td style="padding: 8px;">{v}</td></tr>' for k, v in details.items())}
        </table>
        <p style="color: #64748b; font-size: 12px; margin-top: 24px;">This is an automated notification from Task Scheduler.</p>
      </div>
    </body></html>
    """


async def send_email_notification(
    to_email: str,
    task_name: str,
    event_type: str,
    execution_id: str,
    details: dict,
) -> bool:
    """Send an HTML email notification via SMTP."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("smtp_not_configured")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"[Task Scheduler] {task_name} – {event_type.upper()}"
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to_email
    msg.attach(MIMEText(_build_email_body(event_type, task_name, execution_id, details), "html"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            use_tls=settings.SMTP_TLS,
        )
        logger.info("email_sent", to=to_email, event=event_type)
        return True
    except Exception as exc:
        logger.error("email_send_failed", error=str(exc))
        return False


async def send_webhook_notification(
    url: str,
    method: str,
    payload: dict,
    secret: Optional[str] = None,
) -> bool:
    """Send a webhook POST/GET request with optional HMAC signature."""
    import hashlib
    import hmac
    import json

    headers = {"Content-Type": "application/json", "X-Task-Scheduler": "1"}
    if secret:
        body = json.dumps(payload).encode()
        sig = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
        headers["X-Signature-SHA256"] = f"sha256={sig}"

    try:
        async with httpx.AsyncClient(timeout=settings.WEBHOOK_TIMEOUT_SECONDS) as client:
            resp = await client.request(method, url, json=payload, headers=headers)
            resp.raise_for_status()
            logger.info("webhook_sent", url=url, status=resp.status_code)
            return True
    except Exception as exc:
        logger.error("webhook_failed", url=url, error=str(exc))
        return False
