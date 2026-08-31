from datetime import UTC, date, datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.errors import ApplicationError
from app.core.identity import KoryxaIdentity
from app.models.member import MemberRole, OrganizationMember
from app.models.organization import Organization
from app.schemas.organizations import OrganizationCreate, OrganizationOnboarding, OrganizationUpdate
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
        if data.name is not None:
            organization.name = data.name.strip()
        if data.business_category is not None:
            organization.business_category = data.business_category.strip()
        if data.latitude is not None:
            organization.latitude = data.latitude
        if data.longitude is not None:
            organization.longitude = data.longitude
        if data.geofence_radius_meters is not None:
            organization.geofence_radius_meters = data.geofence_radius_meters
        if data.sector is not None:
            organization.sector = data.sector.strip()
        if data.country is not None:
            organization.country = data.country.strip()
        if data.responsible_name is not None:
            organization.responsible_name = data.responsible_name.strip()
        await session.commit()
        await session.refresh(organization)
        return organization

    async def complete_onboarding(
        self,
        session: AsyncSession,
        organization: Organization,
        data: OrganizationOnboarding,
    ) -> Organization:
        from app.models.registers import (
            DocumentType,
            PaymentStatus,
            RecordSource,
            RecordStatus,
            Sale,
        )

        organization.name = data.name.strip()
        if data.business_category:
            organization.business_category = data.business_category.strip()
        organization.sector = data.sector.strip() if data.sector else None
        organization.country = data.country.strip() if data.country else None
        organization.responsible_name = data.responsible_name.strip()
        organization.primary_goal = data.primary_goal
        if data.latitude is not None:
            organization.latitude = data.latitude
        if data.longitude is not None:
            organization.longitude = data.longitude
        if data.geofence_radius_meters is not None:
            organization.geofence_radius_meters = data.geofence_radius_meters
        organization.onboarding_completed_at = datetime.now(UTC)

        # Enregistrement du Solde Initial de Caisse (si renseigné)
        if data.initial_cash_balance and data.initial_cash_balance > 0:
            initial_sale = Sale(
                organization_id=organization.id,
                reference=f"INIT-CAISSE-{uuid4().hex[:6].upper()}",
                sale_date=date.today(),
                document_type=DocumentType.RECEIPT,
                client_name="Solde Initial / Fond de Caisse",
                item_label="Report à Nouveau · Solde Initial de Caisse",
                quantity=Decimal("1.00"),
                unit_price=Decimal(str(data.initial_cash_balance)),
                total_amount=Decimal(str(data.initial_cash_balance)),
                paid_amount=Decimal(str(data.initial_cash_balance)),
                currency=data.currency or "XOF",
                payment_method="Espèces",
                payment_status=PaymentStatus.PAID,
                status=RecordStatus.VALIDATED,
                source=RecordSource.MANUAL,
                comment="Configuration initiale du solde de caisse lors de l'onboarding",
                created_by_user_id=organization.created_by_user_id,
                updated_by_user_id=organization.created_by_user_id,
            )
            session.add(initial_sale)

        # Enregistrement des Créances Antérieures (si renseigné)
        if data.historical_receivables and data.historical_receivables > 0:
            rec_sale = Sale(
                organization_id=organization.id,
                reference=f"INIT-CREANCE-{uuid4().hex[:6].upper()}",
                sale_date=date.today(),
                document_type=DocumentType.INVOICE,
                client_name="Créances Clients Antérieures",
                item_label="Report des Factures & Créances en Attente",
                quantity=Decimal("1.00"),
                unit_price=Decimal(str(data.historical_receivables)),
                total_amount=Decimal(str(data.historical_receivables)),
                paid_amount=Decimal("0.00"),
                currency=data.currency or "XOF",
                payment_method="À terme",
                payment_status=PaymentStatus.UNPAID,
                status=RecordStatus.VALIDATED,
                source=RecordSource.MANUAL,
                comment="Créances antérieures reportées lors de l'onboarding",
                created_by_user_id=organization.created_by_user_id,
                updated_by_user_id=organization.created_by_user_id,
            )
            session.add(rec_sale)

        # Enregistrement automatique du numéro WhatsApp du dirigeant comme expéditeur autorisé
        if data.whatsapp_number and data.whatsapp_number.strip():
            from app.models.integrations import WhatsAppAuthorizedSender
            from app.services.whatsapp import normalize_e164

            phone_norm = normalize_e164(data.whatsapp_number)
            if phone_norm and len(phone_norm) >= 7:
                existing_sender = await session.scalar(
                    select(WhatsAppAuthorizedSender).where(
                        WhatsAppAuthorizedSender.organization_id == organization.id,
                        WhatsAppAuthorizedSender.phone_number == phone_norm,
                    )
                )
                if not existing_sender:
                    new_sender = WhatsAppAuthorizedSender(
                        organization_id=organization.id,
                        phone_number=phone_norm,
                        label=f"Numéro principal ({data.responsible_name.strip() if data.responsible_name else 'Dirigeant'})",
                        is_active=True,
                        created_by_user_id=organization.created_by_user_id,
                    )
                    session.add(new_sender)

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
