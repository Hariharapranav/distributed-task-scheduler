<div align="center">

<h1>⚡ TaskFlow</h1>

<p>Production-grade Distributed Task Scheduler & Notification Engine powering async cron workflows, webhook dispatching, shell execution queues, and live event telemetry.</p>

<p>
  <img src="https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white"/>
  <img src="https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white"/>
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white"/>
  <img src="https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white"/>
  <img src="https://img.shields.io/badge/Apache_Kafka-231F20?style=for-the-badge&logo=apache-kafka&logoColor=white"/>
</p>

<p>
  <img src="https://img.shields.io/badge/Celery-5.4-37814A?style=for-the-badge&logo=celery&logoColor=white"/>
  <img src="https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker&logoColor=white"/>
  <img src="https://img.shields.io/badge/Nginx-Proxy-009639?style=for-the-badge&logo=nginx&logoColor=white"/>
  <img src="https://img.shields.io/badge/Render-Deployed-46E3B7?style=for-the-badge&logo=render&logoColor=white"/>
</p>

</div>

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | FastAPI + Uvicorn (async) |
| **Dashboard** | React 18 + Vite + Recharts + WebSockets |
| **Database** | PostgreSQL 15 + SQLAlchemy 2.0 (async) + Alembic |
| **Task Queue** | Celery 5 + Redis 7 Broker |
| **Message Pipeline** | Apache Kafka + Zookeeper |
| **Event Consumer**| Async Python (`aiokafka`) |
| **Auth** | JWT (access + refresh) + bcrypt |
| **Notifications** | SMTP HTML Emails (`aiosmtplib`) + HMAC-SHA256 signed webhooks |
| **Containerization** | Docker + Docker Compose + Nginx |
| **Hosting** | Render (Web API + Workers + Postgres + Redis) |

---

## Architecture

```
Client Requests
      │
      ▼
 Nginx Proxy ────────────────────────── WebSockets (/ws)
      │                                     │
      ├── (REST API /api)                   ▼
 FastAPI App ───────────────────────── React Dashboard
      │
      ├── /auth          JWT sign-in, login, refresh tokens
      ├── /tasks         CRUD schedulers + manual dispatchers
      ├── /executions    Telemetry logs + analytics graphs
      └── /notifications Notification rules & event logs
              │
              ▼ DB Schedules
       Celery Workers (Redis Broker + Beat)
              ├── 🌐 HTTP Request Execution (Webhooks)
              └── 🐚 Terminal Command Execution (Shell)
                      │
                      ▼ Publishes Status
                Apache Kafka
                      │
                      ▼ Consumes Events
                Kafka Consumer Service
                      ├── 📧 SMTP HTML Email Alert
                      └── 🔗 HMAC-SHA256 Signed Webhook Dispatch
```

---

## Folder Structure

```
distributed-task-scheduler/
│
├── backend/                 # FastAPI REST API & Celery Task Worker
│   ├── app/                 # Backend app implementation
│   │   ├── main.py          # App lifespan, routing, CORS
│   │   ├── core/            # Config settings, DB connections, JWT security
│   │   ├── models/          # SQLAlchemy ORM schemas
│   │   ├── schemas/         # Pydantic validation structures
│   │   ├── services/        # Business controllers (WS, Kafka, DB CRUD)
│   │   └── api/             # Auth dependencies & route handlers
│   │
│   ├── worker/              # Celery worker application
│   │   ├── celery_app.py    # Broker configuration & task routings
│   │   └── tasks/           # HTTP Webhook and Shell executors
│   │
│   ├── alembic/             # Database migrations
│   │   ├── env.py
│   │   └── versions/
│   │       └── 001_initial.py
│   │
│   ├── tests/               # pytest automated units suite
│   │   └── test_auth.py
│   │
│   ├── Dockerfile           # Backend container build script
│   └── requirements.txt
│
├── consumer/                # Kafka event consumer daemon
│   ├── handlers/            # Event, notification, and audit routers
│   ├── main.py              # aiokafka client message loop
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                # Vite + React Web Application
│   ├── src/                 # Contexts, component structures, pages
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── Dockerfile
│
├── nginx/                   # Reverse proxy server
│   └── nginx.conf
│
├── docker-compose.yml       # Local orchestration stack template
├── render.yaml              # Infrastructure-as-code Blueprint
├── alembic.ini
└── .env.example
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register operator profile |
| `POST` | `/api/auth/login` | Login → retrieve access & refresh JWTs |
| `POST` | `/api/auth/refresh` | Obtain refreshed JWT access token |
| `GET` | `/api/auth/me` | Retrieve authenticated profile details |
| `GET` | `/api/tasks` | List registered tasks (with telemetry counters) |
| `POST` | `/api/tasks` | Create task scheduler configurations |
| `GET` | `/api/tasks/{id}` | Get detailed task configuration history |
| `PATCH` | `/api/tasks/{id}` | Update settings or toggle execution state |
| `DELETE` | `/api/tasks/{id}` | Delete task registry rules |
| `POST` | `/api/tasks/{id}/trigger` | Dispatch scheduled task manually |
| `GET` | `/api/executions` | Fetch list of task execution logs |
| `GET` | `/api/executions/stats` | Retrieve aggregate metrics for graphics dashboard |
| `POST` | `/api/notifications/rules` | Register alert rule (email/webhook) |
| `GET` | `/api/notifications/logs` | Query delivery verification records |
| `WS` | `/ws/events` | Stream real-time telemetry changes |

> Full interactive docs at **`/api/docs`**

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/Hariharapranav/distributed-task-scheduler.git
cd distributed-task-scheduler

# 2. Configure
cp .env.example .env
# Fill in SMTP credentials and signature keys

# 3. Run
docker-compose up --build

# 4. Explore
open http://localhost
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL async SQLAlchemy database endpoint |
| `REDIS_URL` | Redis endpoint for Celery queues |
| `JWT_SECRET` | Secret key parameter to sign session keys |
| `KAFKA_BOOTSTRAP_SERVERS` | Brokers list of your Apache Kafka server |
| `SMTP_USER` | SMTP server authentication username |
| `SMTP_PASSWORD` | App-specific email password |
| `SMTP_FROM` | Dispatcher notification email sender |
| `WEBHOOK_TIMEOUT_SECONDS` | Outbound request limit for hook receivers |

---

## Task Execution & Notification Flow

```
1. POST /tasks/               → registers scheduling parameters (cron/interval/manual)
2. Celery Beat fires run      → triggers Celery worker (or POST /tasks/{id}/trigger)
3. Worker executes task       → performs HTTP request or runs Local Shell Script
4. Worker records result      → saves runtime outputs, exit codes, & timings to DB
5. Worker publishes status    → emits execution events to Apache Kafka topic
6. Consumer picks up event    → resolves matching notification rules
7. Consumer dispatches alert  → sends SMTP HTML email or POSTs HMAC-signed Webhook
8. Web API pushes updates     → WebSocket alerts React UI to reload telemetry charts
```

---

## Running Tests

```bash
# Run backend pytest suite on local container
docker-compose exec backend pytest tests/ -v
```

---

<div align="center">
  <sub>Built with FastAPI · React · PostgreSQL · Redis · Celery · Apache Kafka · Docker · Render</sub>
</div>
