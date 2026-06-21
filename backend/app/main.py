from contextlib import asynccontextmanager
import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api.routes import auth, tasks, executions, notifications, websocket
from app.services.kafka_producer import get_producer, stop_producer

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle: startup and shutdown hooks."""
    logger.info("app_starting", env=settings.APP_ENV)
    # Warm up Kafka producer
    try:
        await get_producer()
        logger.info("kafka_producer_ready")
    except Exception as exc:
        logger.warning("kafka_producer_init_failed", error=str(exc))

    yield

    # Cleanup
    await stop_producer()
    logger.info("app_shutdown")


app = FastAPI(
    title="Distributed Task Scheduler API",
    description="Schedule, run, and monitor distributed tasks with real-time notifications.",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# ─────────────────────────────────────────────
#  Middleware
# ─────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
#  Routers
# ─────────────────────────────────────────────
app.include_router(auth.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(executions.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(websocket.router)  # /ws prefix already on router


# ─────────────────────────────────────────────
#  Health Check
# ─────────────────────────────────────────────
@app.get("/api/health", tags=["Health"])
async def health():
    return JSONResponse({"status": "ok", "version": "1.0.0"})
