import os
import sqlite3
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./hiring_db.db")

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def run_migrations():
    """Safely apply schema migrations without dropping existing data."""
    if not SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
        return  # Only handle SQLite auto-migration here

    db_path = SQLALCHEMY_DATABASE_URL.replace("sqlite:///", "").replace("./", "")
    # Make path absolute relative to this file's directory
    if not os.path.isabs(db_path):
        db_path = os.path.join(os.path.dirname(__file__), db_path)

    if not os.path.exists(db_path):
        return  # DB not created yet — SQLAlchemy create_all will handle it

    conn = sqlite3.connect(db_path)
    try:
        existing_cols = [row[1] for row in conn.execute("PRAGMA table_info(candidates)").fetchall()]

        migrations = [
            ("created_at", "ALTER TABLE candidates ADD COLUMN created_at DATETIME DEFAULT NULL"),
        ]

        for col_name, sql in migrations:
            if col_name not in existing_cols:
                conn.execute(sql)
                conn.commit()
                print(f"[Migration] Added column: {col_name}")
    finally:
        conn.close()
