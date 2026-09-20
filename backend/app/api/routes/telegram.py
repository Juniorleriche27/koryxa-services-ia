from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.identity import KoryxaIdentity, require_koryxa_identity
from app.core.permissions import get_current_organization, require_permission
from app.db.session import get_session
from app.models.member import OrganizationMember
from app.models.organization import Organization
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
    """Point d'entrée Webhook pour les mises à jour Telegram (Bot KORYXA & Bots personnalisés)."""
    try:
        payload: dict[str, Any] = await request.json()
    except Exception:
        return Response(status_code=status.HTTP_400_BAD_REQUEST)

    await service.handle_inbound_update(s, payload, explicit_org_id=org_id)
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
