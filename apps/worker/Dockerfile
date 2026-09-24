FROM python:3.11-slim

WORKDIR /app

# 1. Install System Dependencies (FFmpeg, Node.js prep, Chromium for Remotion)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    build-essential \
    libpq-dev \
    curl \
    gnupg \
    ca-certificates \
    libcurl4-openssl-dev \
    libssl-dev \
    # Chromium dependencies for Remotion
    libnss3 libxss1 libasound2 libatk-bridge2.0-0 libgtk-3-0 libgbm1 \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get install -y chromium \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer (used by Remotion) to use the installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# 2. Install Python dependencies
COPY apps/worker/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 3. Setup Motion Components (Remotion)
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
