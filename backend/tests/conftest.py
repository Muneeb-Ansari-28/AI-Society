import os
import sys
import pytest

# Ensure backend root is in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database.models import Base
from app.database.repository import Repository
from app.agents.personalities import AGENT_PROFILES

TEST_DB_URL = "sqlite:///:memory:"

@pytest.fixture
def db_session():
    """Provides a fresh, isolated in-memory SQLite database session for each test."""
    engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    SessionTesting = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionTesting()

    # Seed world state, default agents, and relationships
    Repository.initialize_default_data(session)

    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
