"""PostgreSQL transaction lock to serialize tenant-local analytical mutations.

SQLite remains suitable for unit tests, but concurrency acceptance requires
PostgreSQL integration. Locks end automatically with commit or rollback.
"""
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def tenant_transaction_lock(session: AsyncSession, namespace: str, organization_id: str) -> None:
    bind = session.get_bind()
    if bind is None or bind.dialect.name != "postgresql":
        return
    # Namespace and org both participate in the lock key; no shared global lock.
    await session.execute(text(
        "SELECT pg_advisory_xact_lock(hashtext(:namespace), hashtext(:org_id))"
    ), {"namespace": namespace, "org_id": organization_id})
