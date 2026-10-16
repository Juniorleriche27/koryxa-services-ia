"""Manual integration probe: run ONLY on a disposable PostgreSQL test database.

Requires CAURI_ISOLATED_TEST_DSN. Refuses other database names.
"""
import asyncio
import os
from urllib.parse import urlparse
import asyncpg


async def main():
    dsn = os.environ.get("CAURI_ISOLATED_TEST_DSN", "")
    name = urlparse(dsn).path.lstrip("/").lower()
    if not dsn or not any(word in name for word in ("isolated", "validation", "test")):
        raise RuntimeError("Only an explicitly named isolated test database is permitted")
    conn = await asyncpg.connect(dsn)
    tx = conn.transaction()
    await tx.start()
    try:
        await conn.execute("INSERT INTO organizations (id,tenant_id,name,slug,is_active,created_by_user_id) VALUES ('11111111-1111-1111-1111-111111111111','test-a','Test A','test-a',true,'test'),('22222222-2222-2222-2222-222222222222','test-b','Test B','test-b',true,'test')")
        await conn.execute("INSERT INTO finance_cash_accounts (id,organization_id,name,currency,is_active) VALUES ('33333333-3333-3333-3333-333333333333','11111111-1111-1111-1111-111111111111','Main','XOF',true)")
        try:
            await conn.execute("INSERT INTO finance_cash_movements (id,organization_id,account_id,occurred_on,amount,direction,category) VALUES ('44444444-4444-4444-4444-444444444444','22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333','2026-10-16',100,'in','other')")
        except asyncpg.ForeignKeyViolationError:
            print("PASS cross-tenant movement blocked by PostgreSQL FK")
        else:
            raise AssertionError("Cross-tenant movement was accepted")
    finally:
        await tx.rollback()
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
