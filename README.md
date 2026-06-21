# ⚡ TaskFlow — Distributed Task Scheduler & Notification Engine

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11-blue?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Celery-5.4-37814A?style=for-the-badge&logo=celery&logoColor=white" alt="Celery" />
  <img src="https://img.shields.io/badge/Kafka-7.5-000000?style=for-the-badge&logo=apachekafka&logoColor=white" alt="Kafka" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Docker-3.9-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

---

**TaskFlow** is a production-grade, highly scalable Distributed Task Scheduler and real-time Notification Engine. It allows users to schedule dynamic cron schedules, interval tasks, or one-off jobs via HTTP Webhooks or Shell execution command scripts. It monitors executions in real-time, retries failing runs with configurable delays, publishes execution event changes to **Apache Kafka**, and dispatches notifications through SMTP email or custom HMAC-signed webhooks.

## 🚀 Key Features

*   **🔑 Secure Authentication**: Session token tracking using JWT with access and refresh tokens, bcrypt password hashing, and endpoint-level authorization guards.
*   **⚙️ Dual Task Handlers**:
    *   **HTTP/Webhooks**: Dispatches custom outbound requests with visual HTTP method options, headers, request bodies, and timeouts.
    *   **Shell Script Execution**: Runs terminal commands with configurable timeouts and returns execution `stdout` / `stderr`.
*   **⏱️ Dynamic Scheduling**:
    *   *Manual*: Trigger immediately on demand.
    *   *Cron Schedulers*: Linux standard 5-field cron syntax parser (`* * * * *`).
    *   *Interval*: Fixed recurring periods in seconds.
    *   *One-Time*: Target run at specific UTC timestamps.
*   **🔄 Resilience & Auto-Retry**: Automatically retries failed executions with configurable count limits and delays.
*   **📡 Real-Time Monitoring**: Integrates a stateful WebSocket manager to instantly push execution logs, system changes, and notifications to all connected user dashboards.
*   **🔔 Programmable Notifications**: Setup task-specific or global notification rules to dispatch **HTML Email Alerts** (via SMTP) or **HMAC SHA256-signed Webhooks** on task success, failures, or retries.
*   **📊 Premium Analytics Dashboard**: Modern dark-theme UI with throughput sparklines, duration trends, error summaries, and visual cron setup editors.

---

## 🏗️ System Architecture

```
                       ┌─────────────────────────────────────────────────┐
                       │               React.js Dashboard                │
                       │   (Dynamic Charts + Live WebSocket Event Feed)   │
                       └────────────────────────┬────────────────────────┘
                                                │ REST + WebSocket
                                                ▼
                       ┌─────────────────────────────────────────────────┐
                       │                 Nginx Proxy                     │
                       └────────────────────────┬────────────────────────┘
                                                │ Routing
                                                ▼
                       ┌─────────────────────────────────────────────────┐
                       │               FastAPI Backend API               │
                       └─────┬───────────────────┬─────────────────┬─────┘
                             │                   │                 │
                             ▼ Writes            ▼ Dispatches      ▼ Push
                     ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
                     │  PostgreSQL   │   │     Redis     │   │   WebSocket   │
                     │  (App Data)   │   │ (Celery Queue)│   │   (Live UI)   │
                     └───────────────┘   └───────┬───────┘   └───────────────┘
                                                 │
                                                 ▼
                                         ┌───────────────┐
                                         │ Celery Worker │ (HTTP & Shell Execute)
                                         └───────┬───────┘
                                                 │
                                                 ▼ Publishes
                                         ┌───────────────┐
                                         │ Apache Kafka  │ (Event Queue Stream)
                                         └───────┬───────┘
                                                 │
                                                 ▼ Consumes
                                      ┌─────────────────────┐
                                      │   Kafka Consumer    │
                                      └──────┬──────────┬───┘
                                             │          │
                                             ▼ Emails   ▼ Webhooks
                                            📧 SMTP    🔗 Signed POST
```

---

## 🛠️ Tech Stack & Directory Structure

```
distributed-task-scheduler/
├── backend/            # FastAPI REST API & Celery Worker
│   ├── app/            # API implementation, configurations, DB models & routers
│   ├── worker/         # Celery broker configuration & executable tasks
│   ├── alembic/        # Async SQLAlchemy DB Migrations
│   └── tests/          # pytest unit tests
├── consumer/           # Standalone async Kafka consumer & notifier
│   └── handlers/       # Task events, notifications & audit logging rules
├── frontend/           # Vite + React (Tailwind style custom dark mode UI)
│   ├── src/            # Contexts, hooks, API layer, pages & reusable components
│   └── public/
├── nginx/              # Reverse proxy routing setup
└── docker-compose.yml  # Local multi-container development orchestrator
```

---

## 🚦 Getting Started (Local Development)

### Prerequisites
*   [Docker & Docker Desktop](https://www.docker.com/products/docker-desktop/)
*   [Git](https://git-scm.com/)

### 1. Clone & Set Environment variables
Clone the repository:
```bash
git clone https://github.com/Hariharapranav/distributed-task-scheduler.git
cd distributed-task-scheduler
```

Create a local `.env` configuration file from the template:
```bash
cp .env.example .env
```

### 2. Startup Containers
Spin up the local microservices stack:
```bash
docker-compose up --build
```
*Wait a few seconds for Zookeeper, Kafka, and Postgres to pass their health checks. The backend will automatically apply Alembic migrations on startup.*

Access the services:
- 💻 **Frontend Web App**: `http://localhost`
- ⚙️ **FastAPI Swagger API**: `http://localhost/api/docs`

---

## 🔬 Running Tests
You can execute the python unit test suite on the backend container:
```bash
docker-compose exec backend pytest tests/ -v
```

---

## ☁️ Production Deployment
The directory includes a standard unified `render.yaml` template configured to deploy the stack to **Render**:
*   **Web Server**: Run FastAPI endpoint app with `uvicorn`.
*   **Worker Server**: Run Celery worker client.
*   **Beat Scheduler**: Spin up beat service.
*   **Consumer Service**: Deploy Kafka subscriber daemon.
