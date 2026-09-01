import ssl
from celery import Celery
from config import get_worker_settings

settings = get_worker_settings()

redis_url = settings.REDIS_URL
if redis_url.startswith("rediss://") and "ssl_cert_reqs" not in redis_url:
    delimiter = "&" if "?" in redis_url else "?"
    redis_url = f"{redis_url}{delimiter}ssl_cert_reqs=CERT_NONE"

celery_app = Celery(
    "ai_video_worker",
    broker=redis_url,
    backend=redis_url,
    include=["tasks.video_pipeline"],
)

# Concurrency & Workload Optimization for heavy media processing
broker_use_ssl = None
redis_backend_use_ssl = None
if redis_url.startswith("rediss://"):
    broker_use_ssl = {"ssl_cert_reqs": ssl.CERT_NONE}
    redis_backend_use_ssl = {"ssl_cert_reqs": ssl.CERT_NONE}

celery_app.conf.update(
    task_default_queue=settings.CELERY_TASK_DEFAULT_QUEUE,
    worker_prefetch_multiplier=1,      # Prevent worker memory exhaustion
    task_acks_late=True,               # Ensure crash recovery
    task_reject_on_worker_lost=True,
    task_track_started=True,
    broker_use_ssl=broker_use_ssl,
    redis_backend_use_ssl=redis_backend_use_ssl,
    result_expires=3600,
)
