from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.identity import KoryxaIdentity, require_koryxa_identity
from app.core.permissions import get_current_organization, require_permission
from app.db.session import get_session
from app.models.member import OrganizationMember
from app.models.organization import Organization
from app.schemas.whatsapp import (
    WhatsAppAuthorizedSenderCreate,
    WhatsAppAuthorizedSenderList,
    WhatsAppAuthorizedSenderRead,
    WhatsAppAuthorizedSenderUpdate,
    WhatsAppConfig,
    WhatsAppConfigUpdate,
)
from app.services.whatsapp import WhatsAppService

router = APIRouter()
SessionDep = Annotated[AsyncSession, Depends(get_session)]
IdentityDep = Annotated[KoryxaIdentity, Depends(require_koryxa_identity)]
OrgDep = Annotated[Organization, Depends(get_current_organization)]
ManageDep = Annotated[OrganizationMember, Depends(require_permission("organization:manage"))]

service = WhatsAppService()


def _bridge_headers() -> dict[str, str]:
    settings = get_settings()
    secret = settings.proxy_secret or "service-ia-development-only-proxy-secret"
    return {"X-Koryxa-Proxy-Secret": secret}


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
        s,
        raw_body,
        request.headers.get("X-Hub-Signature-256"),
        payload,
        request.headers.get("X-Koryxa-Proxy-Secret"),
    )


@router.get("/config", response_model=WhatsAppConfig)
async def get_whatsapp_config(s: SessionDep, o: OrgDep, _: ManageDep):
    """Récupère la configuration WhatsApp de l'organisation courante."""
    return await service.get_config(s, o.id)


@router.put("/config", response_model=WhatsAppConfig)
async def update_whatsapp_config(
    data: WhatsAppConfigUpdate, s: SessionDep, o: OrgDep, _: ManageDep
):
    """Met à jour les identifiants et le mode de connexion WhatsApp."""
    return await service.update_config(s, o.id, data)


# -------------------------------------------------------------
# GESTION DES EXPÉDITEURS AUTORISÉS (Chantier 1)
# -------------------------------------------------------------

@router.get("/authorized-numbers", response_model=WhatsAppAuthorizedSenderList)
async def list_authorized_numbers(s: SessionDep, o: OrgDep, _: ManageDep):
    """Liste tous les numéros WhatsApp autorisés pour l'organisation."""
    items = await service.list_authorized_senders(s, o.id)
    reads = [
        WhatsAppAuthorizedSenderRead(
            id=item.id,
            organization_id=item.organization_id,
            phone_number=item.phone_number,
            label=item.label,
            is_active=item.is_active,
            created_by_user_id=item.created_by_user_id,
            created_at=item.created_at,
            updated_at=item.updated_at,
        )
        for item in items
    ]
    return WhatsAppAuthorizedSenderList(items=reads, total=len(reads))


@router.post("/authorized-numbers", response_model=WhatsAppAuthorizedSenderRead, status_code=201)
async def add_authorized_number(
    data: WhatsAppAuthorizedSenderCreate,
    s: SessionDep,
    o: OrgDep,
    i: IdentityDep,
    _: ManageDep,
):
    """Ajoute un nouveau numéro WhatsApp autorisé pour l'organisation (E.164)."""
    item = await service.add_authorized_sender(s, o.id, i.user_id, data)
    return WhatsAppAuthorizedSenderRead(
        id=item.id,
        organization_id=item.organization_id,
        phone_number=item.phone_number,
        label=item.label,
        is_active=item.is_active,
        created_by_user_id=item.created_by_user_id,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


@router.patch("/authorized-numbers/{sender_id}", response_model=WhatsAppAuthorizedSenderRead)
async def update_authorized_number(
    sender_id: str,
    data: WhatsAppAuthorizedSenderUpdate,
    s: SessionDep,
    o: OrgDep,
    _: ManageDep,
):
    """Active, désactive ou renomme un numéro WhatsApp autorisé."""
    item = await service.update_authorized_sender(s, o.id, sender_id, data)
    return WhatsAppAuthorizedSenderRead(
        id=item.id,
        organization_id=item.organization_id,
        phone_number=item.phone_number,
        label=item.label,
        is_active=item.is_active,
        created_by_user_id=item.created_by_user_id,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


@router.delete("/authorized-numbers/{sender_id}")
async def delete_authorized_number(
    sender_id: str,
    s: SessionDep,
    o: OrgDep,
    _: ManageDep,
):
    """Supprime un numéro WhatsApp autorisé de l'organisation."""
    await service.delete_authorized_sender(s, o.id, sender_id)
    return {"ok": True, "id": sender_id}


@router.post("/test-connection")
async def test_whatsapp_connection(s: SessionDep, o: OrgDep, _: ManageDep):
    """Teste la connexion avec l'API Meta Cloud en utilisant les identifiants de l'organisation."""
    return await service.test_connection(s, o.id)


@router.get("/session-qr")
async def get_whatsapp_session_qr(o: OrgDep):
    """Récupère le QR Code de session temps réel généré par le bridge Baileys."""
    import httpx
    headers = _bridge_headers()
    for base_url in ("http://koryxa-whatsapp-bridge:8097", "http://127.0.0.1:8097"):
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(f"{base_url}/v1/session/qr?org_id={o.id}", headers=headers)
                if resp.status_code == 200:
                    return resp.json()
        except Exception:
            continue
    return {"status": "disconnected", "qr": None, "phone": None}


@router.get("/session-status")
async def get_whatsapp_session_status(o: OrgDep):
    """Vérifie le statut de la session WhatsApp Multi-Device."""
    import httpx
    headers = _bridge_headers()
    for base_url in ("http://koryxa-whatsapp-bridge:8097", "http://127.0.0.1:8097"):
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                resp = await client.get(f"{base_url}/v1/session/status?org_id={o.id}", headers=headers)
                if resp.status_code == 200:
                    return resp.json()
        except Exception:
            continue
    return {"status": "disconnected", "is_connected": False, "phone": None}


@router.post("/session-disconnect")
async def disconnect_whatsapp_session(o: OrgDep, _: ManageDep):
    """Déconnecte la session WhatsApp active."""
    import httpx
    headers = _bridge_headers()
    for base_url in ("http://koryxa-whatsapp-bridge:8097", "http://127.0.0.1:8097"):
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                resp = await client.post(f"{base_url}/v1/session/disconnect?org_id={o.id}", headers=headers)
                if resp.status_code == 200:
                    return resp.json()
        except Exception:
            continue
    return {"ok": True, "status": "disconnected"}


@router.post("/session-reset")
async def reset_whatsapp_session(o: OrgDep, _: ManageDep):
    """Réinitialise complètement la session et regénère un QR Code neuf."""
    import httpx
    headers = _bridge_headers()
    for base_url in ("http://koryxa-whatsapp-bridge:8097", "http://127.0.0.1:8097"):
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.post(f"{base_url}/v1/session/reset?org_id={o.id}", headers=headers)
                if resp.status_code == 200:
                    return resp.json()
        except Exception:
            continue
    return {"ok": True, "status": "scanning"}
