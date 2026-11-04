import os
from pathlib import Path

from sqlalchemy import JSON, String, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

default_db = (
    (
        Path(__file__).resolve().parents[3]
        if len(Path(__file__).resolve().parents) > 3
        else Path("/srv")
    )
    / "data"
    / "triage.sqlite"
)
default_db.parent.mkdir(parents=True, exist_ok=True)
url = os.getenv("DATABASE_URL", f"sqlite:///{default_db.as_posix()}")
engine = create_engine(
    url, connect_args={"check_same_thread": False} if url.startswith("sqlite") else {}
)
Database = sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class Encounter(Base):
    __tablename__ = "sessions"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(String, unique=True, index=True)
    data: Mapped[dict] = mapped_column(JSON)
    __table_args__ = {"sqlite_autoincrement": True}


class Audit(Base):
    __tablename__ = "audit_events"
    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[str] = mapped_column(String, index=True)
    data: Mapped[dict] = mapped_column(JSON)


class EvaluationRun(Base):
    __tablename__ = "runs"
    run_id: Mapped[str] = mapped_column(String, primary_key=True)
    data: Mapped[dict] = mapped_column(JSON)
