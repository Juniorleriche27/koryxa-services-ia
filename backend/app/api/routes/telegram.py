from __future__ import annotations

import json
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.core.identity import KoryxaIdentity, require_koryxa_identity
from app.core.permissions import get_current_organization, require_permission
from app.db.session import get_session
from app.models.member import OrganizationMember
from app.models.organization import Organization
from app.models.integrations import OrganizationIntegrationConfig, TelegramWebhookEvent
from app.services.telegram_auth import webhook_secret, verify_webhook_secret
from app.schemas.telegram import (
    TelegramAuthorizedUserRead,
    TelegramAuthorizedUserUpdate,
    TelegramConfigRead,
    TelegramCustomBotUpdate,
)
from app.services.telegram import TelegramService

router = APIRouter()
SessionDep = Annotated[AsyncSession, Depends(get_session)]
IdentityDep = Annotated[KoryxaIdentity, Depends(require_koryxa_identity)]
OrgDep = Annotated[Organization, Depends(get_current_organization)]
ManageDep = Annotated[OrganizationMember, Depends(require_permission("organization:manage"))]

service = TelegramService()


@router.post("/webhook")
async def handle_telegram_webhook(
    request: Request,
    s: SessionDep,
    org_id: str | None = Query(None),
):
    """Fail closed: webhook disabled until Telegram sender + tenant binding are proven.

    Never trust `org_id` or `from.id` from unauthenticated public requests.
    """
    raise HTTPException(status_code=403, detail="Webhook Telegram désactivé pour sécurité")


@router.post("/webhook/{integration_id}")
async def handle_authenticated_telegram_webhook(integration_id: str, request: Request, s: SessionDep):
    """Verified Telegram-only ingress. Never trusts org_id or sender from URL/body."""
    cfg = await s.scalar(select(OrganizationIntegrationConfig).where(
        OrganizationIntegrationConfig.id == integration_id,
        OrganizationIntegrationConfig.telegram_active.is_(True),
        OrganizationIntegrationConfig.telegram_webhook_enabled.is_(True),
    ))
    if cfg is None or not cfg.telegram_bot_token_encrypted:
        raise HTTPException(status_code=403, detail="Webhook non autorisé")
    bot_token = service.configs.decrypt(cfg.telegram_bot_token_encrypted)
    try:
        expected_secret = webhook_secret(cfg.id, bot_token or "")
    except ValueError:
        raise HTTPException(status_code=403, detail="Webhook non autorisé") from None
    if not verify_webhook_secret(expected_secret, request.headers.get("X-Telegram-Bot-Api-Secret-Token")):
        raise HTTPException(status_code=403, detail="Webhook non autorisé")
    raw = await request.body()
    if len(raw) > 64 * 1024:
        raise HTTPException(status_code=413, detail="Message trop volumineux")
    try:
        payload = json.loads(raw)
    except (UnicodeError, ValueError):
        raise HTTPException(status_code=400, detail="JSON invalide") from None
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Message invalide")
    update_id = payload.get("update_id")
    if isinstance(update_id, bool) or not isinstance(update_id, int) or not (0 <= update_id <= 2**63-1):
        raise HTTPException(status_code=400, detail="Identifiant Telegram invalide")
    s.add(TelegramWebhookEvent(
        integration_config_id=cfg.id, organization_id=cfg.organization_id, update_id=update_id,
    ))
    try:
        await s.flush()
    except IntegrityError:
        await s.rollback()
        return {"ok": True, "duplicate": True}
    await service.handle_inbound_update(s, payload, explicit_org_id=cfg.organization_id)
    await s.commit()
    return {"ok": True}


@router.get("/config", response_model=TelegramConfigRead)
async def get_telegram_config(
    s: SessionDep,
    _id: IdentityDep,
    org: OrgDep,
):
    """Récupère la configuration Telegram (lien 1-clic, code secret, statut bot)."""
    cfg = await service.get_config(s, org.id)
    await s.commit()
    return cfg


@router.post("/link-code/regenerate")
async def regenerate_telegram_link_code(
    s: SessionDep,
    _id: IdentityDep,
    org: OrgDep,
    _manage: ManageDep,
):
    """Régénère un nouveau code de liaison sécurisé pour l'organisation."""
    new_code = await service.regenerate_link_code(s, org.id)
    await s.commit()
    return {"link_code": new_code, "deep_link_url": f"https://t.me/cauri_koryxa_bot?start={new_code}"}


@router.get("/users", response_model=list[TelegramAuthorizedUserRead])
async def list_authorized_users(
    s: SessionDep,
    _id: IdentityDep,
    org: OrgDep,
):
    """Liste tous les comptes Telegram reliés à cette organisation."""
    return await service.list_authorized_users(s, org.id)


@router.patch("/users/{user_record_id}", response_model=TelegramAuthorizedUserRead)
async def update_authorized_user(
    user_record_id: str,
    data: TelegramAuthorizedUserUpdate,
    s: SessionDep,
    _id: IdentityDep,
    org: OrgDep,
    _manage: ManageDep,
):
    """Modifie le libellé ou l'état actif/inactif d'un compte Telegram connecté."""
    updated = await service.update_authorized_user(s, org.id, user_record_id, data)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable.")
    await s.commit()
    return updated


@router.delete("/users/{user_record_id}")
async def delete_authorized_user(
    user_record_id: str,
    s: SessionDep,
    _id: IdentityDep,
    org: OrgDep,
    _manage: ManageDep,
):
    """Révoque et supprime un compte Telegram relié."""
    success = await service.delete_authorized_user(s, org.id, user_record_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable.")
    await s.commit()
    return {"ok": True}


@router.post("/custom-bot")
async def setup_custom_bot(
    data: TelegramCustomBotUpdate,
    request: Request,
    s: SessionDep,
    _id: IdentityDep,
    org: OrgDep,
    _manage: ManageDep,
):
    """Configure un bot Telegram personnalisé dédié à cette organisation."""
    base_url = str(request.base_url).rstrip("/")
    if "api.service-ia.koryxa.fr" not in base_url and not base_url.startswith("https://"):
        base_url = "https://api.service-ia.koryxa.fr"

    result = await service.set_custom_bot(s, org.id, data.bot_token, base_url)
    if not result.get("ok"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.get("message"))
    await s.commit()
    return result
