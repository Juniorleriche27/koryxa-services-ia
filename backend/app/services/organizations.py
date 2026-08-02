from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ApplicationError
from app.core.identity import KoryxaIdentity
from app.models.member import MemberRole, OrganizationMember
from app.models.organization import Organization
from app.core.config import get_settings
from app.schemas.organizations import OrganizationCreate, OrganizationUpdate
from app.storage.local import LocalFileStorage

LOGO_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
LOGO_MAX_BYTES = 3 * 1024 * 1024


class OrganizationService:
    def __init__(self) -> None:
        self.storage = LocalFileStorage(get_settings().file_storage_path)

    async def create(
        self, session: AsyncSession, identity: KoryxaIdentity, data: OrganizationCreate
    ) -> Organization:
        existing = await session.scalar(
            select(Organization).where(
                (Organization.tenant_id == identity.tenant_id) | (Organization.slug == data.slug)
            )
        )
        if existing is not None:
            raise ApplicationError(
                "organization_exists", "Une organisation existe déjà pour ce tenant ou ce slug", 409
            )
        organization = Organization(
            tenant_id=identity.tenant_id,
            name=data.name,
            slug=data.slug,
            created_by_user_id=identity.user_id,
        )
        session.add(organization)
        await session.flush()
        session.add(
            OrganizationMember(
                organization_id=organization.id, user_id=identity.user_id, role=MemberRole.OWNER
            )
        )
        await session.commit()
        await session.refresh(organization)
        return organization

    async def get_for_tenant(self, session: AsyncSession, tenant_id: str) -> Organization:
        organization = await session.scalar(
            select(Organization).where(
                Organization.tenant_id == tenant_id, Organization.is_active.is_(True)
            )
        )
        if organization is None:
            raise ApplicationError("organization_not_found", "Organisation introuvable", 404)
        return organization

    async def update(
        self, session: AsyncSession, organization: Organization, data: OrganizationUpdate
    ) -> Organization:
        organization.name = data.name.strip()
        await session.commit()
        await session.refresh(organization)
        return organization

    async def update_logo(
        self,
        session: AsyncSession,
        organization: Organization,
        filename: str,
        content_type: str,
        content: bytes,
    ) -> Organization:
        if content_type not in LOGO_CONTENT_TYPES or not self._has_valid_signature(content_type, content):
            raise ApplicationError("invalid_logo", "Le logo doit être une image PNG, JPEG ou WebP", 400)
        if not content or len(content) > LOGO_MAX_BYTES:
            raise ApplicationError(
                "logo_too_large",
                "Le logo optimisé dépasse 3 Mo. Réduisez l’image puis réessayez.",
                413,
            )
        previous_key = organization.logo_storage_key
        organization.logo_storage_key = self.storage.save(organization.id, filename, content)
        organization.logo_content_type = content_type
        organization.logo_updated_at = datetime.now(UTC)
        await session.commit()
        await session.refresh(organization)
        if previous_key:
            self.storage.delete(previous_key)
        return organization

    def read_logo(self, organization: Organization) -> tuple[bytes, str]:
        if not organization.logo_storage_key or not organization.logo_content_type:
            raise ApplicationError("logo_not_found", "Logo introuvable", 404)
        try:
            return self.storage.read(organization.logo_storage_key), organization.logo_content_type
        except (OSError, ValueError) as exc:
            raise ApplicationError("logo_unavailable", "Le logo est indisponible", 404) from exc

    @staticmethod
    def _has_valid_signature(content_type: str, content: bytes) -> bool:
        if content_type == "image/png":
            return content.startswith(b"\x89PNG\r\n\x1a\n")
        if content_type == "image/jpeg":
            return content.startswith(b"\xff\xd8\xff")
        return len(content) >= 12 and content[:4] == b"RIFF" and content[8:12] == b"WEBP"
