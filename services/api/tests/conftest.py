import os
import tempfile
from pathlib import Path

import pytest

os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp(prefix="group1-test-")) / "test.sqlite"
).replace("\\", "/")


@pytest.fixture(autouse=True)
def clean_db():
    from app.db import Base, engine
    from app.main import listeners, locks

    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    locks.clear()
    listeners.clear()
    yield
