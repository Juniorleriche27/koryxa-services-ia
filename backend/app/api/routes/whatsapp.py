from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, Request, Response
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
    s: SessionDep,
    hub_mode: str | None = Query(None, alias="hub.mode"),
    hub_verify_token: str | None = Query(None, alias="hub.verify_token"),
    hub_challenge: str | None = Query(None, alias="hub.challenge"),
):
    """Handshake de vérification pour Meta WhatsApp Cloud API."""
    challenge = await service.verify_webhook(s, hub_mode, hub_verify_token, hub_challenge)
    return Response(content=challenge, media_type="text/plain")


@router.post("/webhook")
async def handle_inbound_whatsapp(request: Request, s: SessionDep):
    """Réception et traitement automatique d'un message entrant WhatsApp."""
    raw_body = await request.body()
    try:
        payload: dict[str, Any] = await request.json()
    except ValueError:
        from app.core.errors import ApplicationError

        raise ApplicationError("invalid_whatsapp_payload", "JSON WhatsApp invalide", 400) from None
    return await service.process_inbound_payload(
        s, raw_body, request.headers.get("X-Hub-Signature-256"), payload
    )


@router.get("/config", response_model=WhatsAppConfig)
async def get_whatsapp_config(s: SessionDep, o: OrgDep, _: ManageDep):
    """Récupère la configuration WhatsApp de l'organisation courante."""
    return await service.get_config(s, o.id)


@router.put("/config", response_model=WhatsAppConfig)
async def update_whatsapp_config(
    data: WhatsAppConfigUpdate, s: SessionDep, o: OrgDep, _: ManageDep
):
    """Met à jour les identifiants et numéros autorisés WhatsApp."""
    return await service.update_config(s, o.id, data)
