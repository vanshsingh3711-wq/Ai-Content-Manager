FROM python:3.11-slim

WORKDIR /app

# 1. Install System Dependencies (FFmpeg, Node.js prep for Canvas renderer)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    build-essential \
    libpq-dev \
    curl \
    gnupg \
    ca-certificates \
    libcurl4-openssl-dev \
    libssl-dev \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# 2. Install Python dependencies
COPY apps/worker/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 3. Setup Motion Components (Canvas Renderer)
# We copy this first so Docker caches the npm install step
COPY packages/motion-components /app/packages/motion-components
WORKDIR /app/packages/motion-components
RUN npm install

# 4. Copy the Worker application code and API models
WORKDIR /app
COPY apps/api ./apps/api
COPY apps/worker ./apps/worker
WORKDIR /app/apps/worker

# 5. Run Celery worker
CMD ["celery", "-A", "celery_app.celery_app", "worker", "--loglevel=info", "--concurrency=1", "-E"]
