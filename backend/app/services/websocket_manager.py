import asyncio
from typing import Dict, Set
from fastapi import WebSocket
import structlog

logger = structlog.get_logger()


class WebSocketManager:
    """Manages WebSocket connections grouped by user_id."""

    def __init__(self):
        # user_id → set of websocket connections
        self._connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self._connections:
            self._connections[user_id] = set()
        self._connections[user_id].add(websocket)
        logger.info("ws_connected", user_id=user_id, total=len(self._connections[user_id]))

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self._connections:
            self._connections[user_id].discard(websocket)
            if not self._connections[user_id]:
                del self._connections[user_id]
        logger.info("ws_disconnected", user_id=user_id)

    async def send_to_user(self, user_id: str, message: dict):
        """Send a message to all connections for a specific user."""
        if user_id not in self._connections:
            return
        dead: Set[WebSocket] = set()
        for ws in self._connections[user_id].copy():
            try:
                await ws.send_json(message)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self._connections[user_id].discard(ws)

    async def broadcast(self, message: dict):
        """Broadcast a message to ALL connected users."""
        for user_id in list(self._connections.keys()):
            await self.send_to_user(user_id, message)

    @property
    def active_connections(self) -> int:
        return sum(len(v) for v in self._connections.values())


# Singleton instance
ws_manager = WebSocketManager()
