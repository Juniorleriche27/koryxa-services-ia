from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.identity import KoryxaIdentity, require_koryxa_identity
from app.core.permissions import get_current_organization, require_permission
from app.db.session import get_session
from app.models.member import OrganizationMember
from app.models.organization import Organization
from app.schemas.whatsapp import WhatsAppConfig, WhatsAppConfigUpdate
from app.services.whatsapp import WhatsAppService

router = APIRouter()
SessionDep = Annotated[AsyncSession, Depends(get_session)]
IdentityDep = Annotated[KoryxaIdentity, Depends(require_koryxa_identity)]
OrgDep = Annotated[Organization, Depends(get_current_organization)]
ManageDep = Annotated[OrganizationMember, Depends(require_permission("organization:manage"))]

service = WhatsAppService()


@router.get("/webhook")
async def verify_whatsapp_webhook(
    hub_mode: str | None = Query(None, alias="hub.mode"),
    hub_verify_token: str | None = Query(None, alias="hub.verify_token"),
    hub_challenge: str | None = Query(None, alias="hub.challenge"),
):
    """Handshake de vérification pour Meta WhatsApp Cloud API."""
    challenge = service.verify_webhook(hub_mode, hub_verify_token, hub_challenge)
    return Response(content=challenge, media_type="text/plain")


@router.post("/webhook")
async def handle_inbound_whatsapp(
    payload: dict[str, Any], s: SessionDep, org_id: str | None = Query(None, alias="org_id")
):
    """Réception et traitement automatique d'un message entrant WhatsApp."""
    return await service.process_inbound_payload(s, payload, default_org=org_id)


@router.get("/config", response_model=WhatsAppConfig)
async def get_whatsapp_config(o: OrgDep, _: ManageDep):
    """Récupère la configuration WhatsApp de l'organisation courante."""
    return service.get_config(o.id)


@router.put("/config", response_model=WhatsAppConfig)
async def update_whatsapp_config(data: WhatsAppConfigUpdate, o: OrgDep, _: ManageDep):
    """Met à jour les identifiants et numéros autorisés WhatsApp."""
    return service.update_config(o.id, data)
