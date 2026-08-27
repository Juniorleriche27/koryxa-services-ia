import os
from collections.abc import AsyncIterator

import pytest

os.environ["SERVICE_IA_ENVIRONMENT"] = "test"
os.environ["SERVICE_IA_DATABASE_URL"] = "sqlite+aiosqlite:////tmp/koryxa_test.db"
os.environ["SERVICE_IA_KNOWLIA_TIMEOUT_SECONDS"] = "0.1"
os.environ["SERVICE_IA_FILE_STORAGE_PATH"] = "/tmp/koryxa-service-ia-test-files"

from app.db.base import Base
from app.db.session import engine


@pytest.fixture(autouse=True)
async def setup_test_database() -> AsyncIterator[None]:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
