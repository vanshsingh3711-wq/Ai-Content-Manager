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


def _ensure_schema_migrations(target_engine) -> None:
    """Safely adds missing columns to existing tables for backwards compatibility."""
    from sqlalchemy import inspect, text
    try:
        inspector = inspect(target_engine)
        tables = inspector.get_table_names()
        if "social_accounts" in tables:
            columns = {col["name"] for col in inspector.get_columns("social_accounts")}
            with target_engine.begin() as conn:
                if "account_name" not in columns:
                    conn.execute(text("ALTER TABLE social_accounts ADD COLUMN account_name VARCHAR(255)"))
                if "account_avatar" not in columns:
                    conn.execute(text("ALTER TABLE social_accounts ADD COLUMN account_avatar VARCHAR(1024)"))
                if "scopes" not in columns:
                    conn.execute(text("ALTER TABLE social_accounts ADD COLUMN scopes VARCHAR(1024)"))
                if "is_active" not in columns:
                    is_sqlite = target_engine.dialect.name == "sqlite"
                    default_bool = "1" if is_sqlite else "TRUE"
                    conn.execute(text(f"ALTER TABLE social_accounts ADD COLUMN is_active BOOLEAN DEFAULT {default_bool}"))
                if "created_at" not in columns:
                    conn.execute(text("ALTER TABLE social_accounts ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
                if "updated_at" not in columns:
                    conn.execute(text("ALTER TABLE social_accounts ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
    except Exception as e:
        print(f"[init_db] Note on schema migration: {e}")


def init_db() -> None:
    """Initialize database tables according to SQLModel metadata."""
    import os
    if settings.DATABASE_URL.startswith("sqlite:///"):
        db_file = settings.DATABASE_URL.replace("sqlite:///", "")
        if db_file and not db_file.startswith(":memory:"):
            os.makedirs(os.path.dirname(os.path.abspath(db_file)), exist_ok=True)
    SQLModel.metadata.create_all(engine)
    _ensure_schema_migrations(engine)


def get_session() -> Generator[Session, None, None]:
    """Dependency for providing database sessions per request."""
    with Session(engine) as session:
        yield session
