from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from .models import Base
from ..config import DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)

    # Auto-migrate SQLite columns if table already exists
    if "sqlite" in DATABASE_URL:
        with engine.connect() as conn:
            # Check memories table columns
            cursor = conn.connection.cursor()
            cursor.execute("PRAGMA table_info(memories)")
            columns = [row[1] for row in cursor.fetchall()]

            if "location" not in columns:
                cursor.execute("ALTER TABLE memories ADD COLUMN location VARCHAR(100) DEFAULT ''")
            if "day" not in columns:
                cursor.execute("ALTER TABLE memories ADD COLUMN day INTEGER DEFAULT 1")
            if "is_promise" not in columns:
                cursor.execute("ALTER TABLE memories ADD COLUMN is_promise BOOLEAN DEFAULT 0")
            conn.connection.commit()
