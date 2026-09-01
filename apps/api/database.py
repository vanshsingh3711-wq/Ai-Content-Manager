from typing import Generator
from sqlmodel import Session, SQLModel, create_engine
from config import get_settings
import models  # Ensure all models are registered in SQLModel.metadata

settings = get_settings()

# Adjust connect_args for SQLite if used in development
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    echo=(settings.ENVIRONMENT == "development"),
    connect_args=connect_args,
    pool_pre_ping=True,  # Fixes "SSL connection has been closed unexpectedly"
    pool_recycle=300,    # Recycle connections every 5 minutes
)


def init_db() -> None:
    """Initialize database tables according to SQLModel metadata."""
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """Dependency for providing database sessions per request."""
    with Session(engine) as session:
        yield session
