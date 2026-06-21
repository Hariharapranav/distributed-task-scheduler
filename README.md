# ⚡ TaskFlow

> **Distributed Task Scheduler & Notification Engine**
>
> A production-grade, highly resilient platform designed for orchestrating cron schedules, interval triggers, and one-off tasks with real-time UI telemetry and failure alerts.

<p align="left">
  <a href="#-key-features">🎯 Features</a> •
  <a href="#-architecture">🏗️ Architecture</a> •
  <a href="#%EF%B8%8F-quick-start">🚀 Quick Start</a> •
  <a href="#-directory-structure">📁 Structure</a> •
  <a href="#%EF%B8%8F-production-deployment">☁️ Deployment</a>
</p>

---

## 🛠️ Tech Stack

| Component | Tech Badge | Role |
| :--- | :--- | :--- |
| **Frontend** | ![](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black) <br> ![](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white) | Live Dashboard, Telemetry Charts, and Visual Cron Scheduler Builder |
| **API Backend** | ![](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white) <br> ![](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white) | REST API Router, WebSocket Real-time Pushes, JWT Security, & API Gateways |
| **Worker Queue** | ![](https://img.shields.io/badge/Celery-37814A?style=flat-square&logo=celery&logoColor=white) <br> ![](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white) | Distributed Job Executer clusters performing HTTP Webhooks & Shell commands |
| **Messaging** | ![](https://img.shields.io/badge/Apache_Kafka-231F20?style=flat-square&logo=apache-kafka&logoColor=white) | Streaming Pipeline distributing task execution status change events |
| **Event Consumer**| ![](https://img.shields.io/badge/Python_Async-3776AB?style=flat-square&logo=python&logoColor=white) | Daemon subscribing to Kafka events and dispatching user rule notifications |
| **Database** | ![](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white) | Persistent Storage keeping registry schemas, run logs, and user policies |
| **Orchestration** | ![](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white) <br> ![](https://img.shields.io/badge/Nginx-009639?style=flat-square&logo=nginx&logoColor=white) | Load Balancer reverse proxy router & local containerized orchestrator |

---

## 🎯 Key Features

*   **🔒 Auth Gateway**: Secure JWT credentials (access/refresh tokens) and bcrypt hashing.
*   **🛠️ Execution Handlers**:
    *   `HTTP/Webhook`: Dynamic methods (`GET`/`POST`/`PUT`/`DELETE`), request body payloads, headers, and timeouts.
    *   `Shell command`: Run shell scripts, return terminal exit codes, standard output, and logs.
*   **⏱️ Dynamic Scheduling**:
    *   *Manual*: Queues instantly on demand.
    *   *Cron Expressions*: Linux standard 5-field crontabs (`*/5 * * * *`).
    *   *Intervals*: Repeat continuously every $N$ seconds.
    *   *One-Time*: Target exact UTC timestamps.
*   **🔄 Fault Tolerance**: Automatically retry failing tasks with configurable run delays.
*   **📡 WebSocket Pushes**: Instant client-side state updates for new runs, logs, and logs.
*   **🔔 Routing Rules**: Configure task-specific rules to trigger **SMTP HTML emails** or **HMAC-signed Webhooks** on task success or failure.

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────┐
│                   React.js Dashboard                   │
│        (Live Execution Telemetry & Status Feed)        │
└───────────────────────────┬────────────────────────────┘
                            │ (REST + WebSockets)
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Nginx Proxy (Port 80)                │
└───────────────────────────┬────────────────────────────┘
                            │ (Reverse Proxy)
                            ▼
┌────────────────────────────────────────────────────────┐
│                    FastAPI App API                     │
└─────┬─────────────────────┬──────────────────────┬─────┘
      │                     │                      │
      ▼                     ▼                      ▼
┌───────────┐         ┌───────────┐          ┌───────────┐
│ Postgres  │         │   Redis   │          │ WebSocket │
│ (Schemas) │         │ (Broker)  │          │ (Pushes)  │
└───────────┘         └─────┬─────┘          └───────────┘
                            │
                            ▼
                      ┌───────────┐
                      │  Celery   │ ───► Executes (HTTP/Shell)
                      └─────┬─────┘
                            │
                            ▼ (Publishes Status)
                      ┌───────────┐
                      │   Kafka   │
                      └─────┬─────┘
                            │
                            ▼ (Consumes Events)
                      ┌───────────┐
                      │ Consumer  │ ───► Dispatches Notifications
                      └───────────────── (Email / Signed Webhooks)
```

---

## 🚀 Quick Start

### 1. Environment Config
```bash
# Clone the repository
git clone https://github.com/Hariharapranav/distributed-task-scheduler.git
cd distributed-task-scheduler

# Copy the environment template
cp .env.example .env
```

### 2. Run Infrastructure
```bash
# Startup all microservices locally
docker-compose up --build
```

### 3. Service Entrypoints
*   **💻 Control Dashboard**: `http://localhost`
*   **⚙️ Swagger API Docs**: `http://localhost/api/docs`

### 4. Tests Run
```bash
docker-compose exec backend pytest tests/
```

---

## 📁 Directory Structure

```
.
├── backend/            # FastAPI Endpoint & Celery Task Worker
│   ├── app/            # Models, API routes, security guards, schemas
│   ├── worker/         # Celery setup and executable task payloads
│   ├── alembic/        # Relational database migrations
│   └── tests/          # pytest unit tests
├── consumer/           # Python Kafka event subscriber
│   └── handlers/       # Rules for emails, webhooks, and audit logs
├── frontend/           # React SPA Interface
│   └── src/            # Contexts, page controllers, and charts
├── nginx/              # Routing configurations
└── docker-compose.yml  # Local multi-service orchestrator
```

---

## ☁️ Production Deployment

Deploy the services to **Render** using the predefined [render.yaml](file:///d:/distributed-task-scheduler/render.yaml) blueprint:

1.  **`taskscheduler-api`**: FastAPI server running on `uvicorn`.
2.  **`taskscheduler-worker`**: Celery executing client processes.
3.  **`taskscheduler-beat`**: Celery Beat scheduler instance.
4.  **`taskscheduler-consumer`**: Standalone Kafka consumer daemon.
