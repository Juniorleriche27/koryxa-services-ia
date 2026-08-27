import os
from collections.abc import AsyncIterator
import pytest

os.environ.setdefault("SERVICE_IA_ENVIRONMENT", "test")
os.environ.setdefault("SERVICE_IA_DATABASE_URL", "sqlite+aiosqlite:///:memory:")

from app.db.base import Base
from app.db.session import engine


@pytest.fixture(autouse=True)
async def setup_test_database() -> AsyncIterator[None]:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
