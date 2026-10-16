"""Release review: transaction locking and duplicate movement handling."""
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.dialects import postgresql, sqlite

from app.services.tenant_lock import tenant_transaction_lock


@pytest.mark.asyncio
async def test_tenant_lock_uses_two_component_postgres_advisory_key():
    session = MagicMock()
    session.get_bind.return_value.dialect = postgresql.dialect()
    session.execute = AsyncMock()
    await tenant_transaction_lock(session, "radar_run", "org-a")
    session.execute.assert_awaited_once()
    statement, params = session.execute.call_args.args[0], session.execute.call_args.args[1]
    assert "pg_advisory_xact_lock" in str(statement)
    assert params == {"namespace": "radar_run", "org_id": "org-a"}


@pytest.mark.asyncio
async def test_tenant_lock_does_not_send_pg_sql_to_sqlite():
    session = MagicMock()
    session.get_bind.return_value.dialect = sqlite.dialect()
    session.execute = AsyncMock()
    await tenant_transaction_lock(session, "radar_run", "org-a")
    session.execute.assert_not_awaited()
