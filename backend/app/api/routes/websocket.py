from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.core.security import decode_token
from app.services.websocket_manager import ws_manager
import structlog

logger = structlog.get_logger()

router = APIRouter(prefix="/ws", tags=["WebSocket"])


@router.websocket("/events")
async def websocket_events(
    websocket: WebSocket,
    token: str = Query(...),
):
    """
    WebSocket endpoint for real-time task/notification events.
    Client connects: ws://host/ws/events?token=<access_token>
    """
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        await websocket.close(code=4001, reason="Unauthorized")
        return

    user_id = payload.get("sub")
    await ws_manager.connect(websocket, user_id)

    try:
        # Send initial connection confirmation
        await websocket.send_json({"type": "connected", "user_id": user_id})

        # Keep connection alive; client may send pings
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, user_id)
        logger.info("ws_client_disconnected", user_id=user_id)
