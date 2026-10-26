import os
import pytest
from sqlmodel import SQLModel


@pytest.fixture(autouse=True, scope="session")
def setup_test_databases():
    """Initializes SQLite databases and tables before running test sessions."""
    try:
        from database import init_db
        init_db()
    except Exception as e:
        print(f"[conftest] Note on init_db: {e}")

    try:
        from config import worker_engine, settings
        if settings.DATABASE_URL.startswith("sqlite:///"):
            db_file = settings.DATABASE_URL.replace("sqlite:///", "")
            if db_file and not db_file.startswith(":memory:"):
                os.makedirs(os.path.dirname(os.path.abspath(db_file)), exist_ok=True)
        SQLModel.metadata.create_all(worker_engine)
    except Exception as e:
        print(f"[conftest] Note on worker_engine init: {e}")
