"""Verify that PostgreSQL itself refuses audit UPDATE and DELETE operations."""
import asyncio
import os
from urllib.parse import urlparse
from uuid import uuid4

import asyncpg


async def main():
    dsn = os.environ.get("CAURI_ISOLATED_TEST_DSN", "")
    name = urlparse(dsn).path.lstrip("/").lower()
    if not dsn or not any(word in name for word in ("isolated", "validation", "test")):
        raise RuntimeError("Only an explicitly named isolated test database is permitted")
    conn = await asyncpg.connect(dsn)
    org_id, event_id = str(uuid4()), str(uuid4())
    try:
        await conn.execute(
            "INSERT INTO organizations (id,tenant_id,name,slug,is_active,created_by_user_id) "
            "VALUES ($1,$2,'Audit Test',$3,true,'test')",
            org_id, f"audit-{org_id}", f"audit-{org_id}",
        )
        await conn.execute(
            "INSERT INTO financial_audit_events "
            "(id,organization_id,entity_type,entity_id,event_type,actor_user_id,payload) "
            "VALUES ($1,$2,'cash_movement',$3,'recorded','test','{}'::json)",
            event_id, org_id, str(uuid4()),
        )
        for statement in (
            "UPDATE financial_audit_events SET event_type='tampered' WHERE id=$1",
            "DELETE FROM financial_audit_events WHERE id=$1",
        ):
            try:
                await conn.execute(statement, event_id)
            except asyncpg.ObjectNotInPrerequisiteStateError:
                pass
            else:
                raise AssertionError("PostgreSQL accepted mutation of append-only audit evidence")
        print("PASS PostgreSQL append-only financial audit: UPDATE and DELETE rejected")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
