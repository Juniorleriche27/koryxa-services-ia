"""End-to-end concurrent Radar runs against a disposable PostgreSQL database.

CAURI_ISOLATED_TEST_DSN must name a test/validation database, never production.
"""
from __future__ import annotations

import asyncio
import os
from urllib.parse import urlparse
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.models.organization import Organization
from app.models.registers import Offer, RecordStatus
from app.models.radar import RadarAlert, RadarRun
from app.services.radar import RadarService


async def main():
    dsn = os.environ.get("CAURI_ISOLATED_TEST_DSN", "")
    name = urlparse(dsn).path.lstrip("/").lower()
    if not dsn or not any(x in name for x in ("isolated", "validation", "test")):
        raise RuntimeError("Only a disposable PostgreSQL test database is permitted")
    dsn = dsn.replace("postgresql://", "postgresql+asyncpg://", 1)
    engine = create_async_engine(dsn, echo=False, pool_size=4)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    org_id = str(uuid4())
    async with factory() as session:
        session.add(Organization(id=org_id, tenant_id=f"pg-radar-{org_id}", name="Concurrency Test",
                                 slug=f"pg-radar-{org_id}", created_by_user_id="test"))
        session.add(Offer(organization_id=org_id, name="Offer without price",
                          price=None, status=RecordStatus.VALIDATED,
                          created_by_user_id="test", updated_by_user_id="test"))
        await session.commit()

    async def run():
        async with factory() as session:
            return await RadarService().run(session, org_id, "test-user")

    result = await asyncio.wait_for(asyncio.gather(run(), run()), timeout=60)
    async with factory() as session:
        alerts = (await session.scalars(select(RadarAlert).where(
            RadarAlert.organization_id == org_id,
            RadarAlert.rule_code == "offer.price_missing",
        ))).all()
        runs = (await session.scalars(select(RadarRun).where(RadarRun.organization_id == org_id))).all()
    assert len(result) == 2
    assert len(alerts) == 1, f"Expected one alert, received {len(alerts)}"
    assert len(runs) == 2, f"Expected two runs, received {len(runs)}"
    print("PASS full RadarService PostgreSQL concurrency: two runs, one alert, one tenant")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
