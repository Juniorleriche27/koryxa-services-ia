from __future__ import annotations

import asyncio

from sqlalchemy import select

from app.db.session import SessionFactory
from app.models.member import MemberRole, OrganizationMember
from app.models.organization import Organization
from app.models.registers import Offer, Procedure, RecordStatus, Sale


async def seed() -> None:
    tenant_id = "pilot-demo"
    user_id = "pilot-owner"
    async with SessionFactory() as session:
        organization = await session.scalar(
            select(Organization).where(Organization.tenant_id == tenant_id)
        )
        if organization is not None:
            print("Demo data already exists")
            return
        organization = Organization(
            tenant_id=tenant_id,
            name="Entreprise pilote KORYXA",
            slug="entreprise-pilote-koryxa",
            created_by_user_id=user_id,
        )
        session.add(organization)
        await session.flush()
        session.add(
            OrganizationMember(
                organization_id=organization.id,
                user_id=user_id,
                role=MemberRole.OWNER,
            )
        )
        session.add_all(
            [
                Offer(
                    organization_id=organization.id,
                    name="Audit digital PME",
                    price=150000,
                    currency="XOF",
                    status=RecordStatus.VALIDATED,
                    created_by_user_id=user_id,
                    updated_by_user_id=user_id,
                ),
                Sale(
                    organization_id=organization.id,
                    reference="V-DEMO-001",
                    sale_date=__import__("datetime").date.today(),
                    client_name="Client pilote",
                    item_label="Audit digital PME",
                    quantity=1,
                    unit_price=150000,
                    discount=0,
                    total_amount=150000,
                    created_by_user_id=user_id,
                    updated_by_user_id=user_id,
                ),
                Procedure(
                    organization_id=organization.id,
                    title="Accueil d'un nouveau client",
                    department="operations",
                    responsible_user_id=user_id,
                    status=RecordStatus.TO_VERIFY,
                    created_by_user_id=user_id,
                    updated_by_user_id=user_id,
                ),
            ]
        )
        await session.commit()
        print("Demo data created for tenant pilot-demo")


if __name__ == "__main__":
    asyncio.run(seed())
