from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.crypto import SecretCipher
from app.models.integrations import OrganizationIntegrationConfig


class IntegrationConfigService:
    def __init__(self) -> None:
        self.cipher = SecretCipher()

    async def get(
        self, session: AsyncSession, organization_id: str
    ) -> OrganizationIntegrationConfig:
        config = await session.scalar(
            select(OrganizationIntegrationConfig).where(
                OrganizationIntegrationConfig.organization_id == organization_id
            )
        )
        if config is None:
            config = OrganizationIntegrationConfig(organization_id=organization_id)
            session.add(config)
            await session.flush()
        return config

    async def by_phone(
        self, session: AsyncSession, phone_number_id: str
    ) -> OrganizationIntegrationConfig | None:
        return await session.scalar(
            select(OrganizationIntegrationConfig).where(
                OrganizationIntegrationConfig.whatsapp_phone_number_id == phone_number_id,
                OrganizationIntegrationConfig.whatsapp_active.is_(True),
            )
        )

    def encrypt(self, value: str | None) -> str | None:
        return self.cipher.encrypt(value.strip() if value else None)

    def decrypt(self, value: str | None) -> str | None:
        return self.cipher.decrypt(value)
