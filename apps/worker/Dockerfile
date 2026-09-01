FROM python:3.11-slim

WORKDIR /app

# Install FFmpeg and system dependencies for media rendering
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy worker application code
COPY . .

# Run Celery worker with single concurrency for heavy video jobs
CMD ["celery", "-A", "celery_app.celery_app", "worker", "--loglevel=info", "--concurrency=1", "-E"]
