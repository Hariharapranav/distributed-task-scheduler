FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev curl && \
    rm -rf /var/lib/apt/lists/*

COPY consumer/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Also install backend shared code (models, services, config)
COPY backend/app /app/app
COPY consumer /app/consumer

CMD ["python", "consumer/main.py"]


