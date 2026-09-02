import os
import sys
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlmodel import Session, create_engine

# Add apps/api to path so worker can reuse SQLModel models
api_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "api"))
if api_path not in sys.path:
    sys.path.insert(0, api_path)


class WorkerSettings(BaseSettings):
    PROJECT_NAME: str = "AI Video Worker"
    ENVIRONMENT: str = "development"
    # Broker & Backend
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_TASK_DEFAULT_QUEUE: str = "video_processing_queue"
    
    # Database
    DATABASE_URL: str = "sqlite:///../api/dev.db"
    
    # Storage / Cloudflare R2 / S3
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = ""
    R2_ENDPOINT_URL: str = ""
    
    # AI Keys (Phase 4)
    GEMINI_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""
    DEEPSEEK_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    PEXELS_API_KEY: str = ""

    # Media temporary processing folder
    TEMP_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "media_temp"))

    model_config = SettingsConfigDict(
        env_file=(".env", "../../.env", "../api/.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


# Alias for compatibility
Settings = WorkerSettings


@lru_cache()
def get_worker_settings() -> WorkerSettings:
    return WorkerSettings()


# Compatibility alias
get_settings = get_worker_settings


# Dedicated worker database engine
settings = get_worker_settings()
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

worker_engine = create_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args=connect_args,
    pool_pre_ping=True,  # Fixes "SSL connection has been closed unexpectedly"
    pool_recycle=300,    # Recycle connections every 5 minutes
)


def get_worker_db() -> Session:
    """Returns a new database session for worker task execution."""
    return Session(worker_engine)
