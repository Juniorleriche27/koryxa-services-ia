from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import get_current_organization, require_permission
from app.db.session import get_session
from app.models.member import OrganizationMember
from app.models.organization import Organization
from app.schemas.billing import (
    BillingCheckoutRequest,
    BillingCheckoutResponse,
    BillingStatusResponse,
    BillingWebhookPayload,
)
from app.services.billing import BillingService

router = APIRouter()

SessionDep = Annotated[AsyncSession, Depends(get_session)]
OrganizationDep = Annotated[Organization, Depends(get_current_organization)]
ManageDep = Annotated[OrganizationMember, Depends(require_permission("organization:manage"))]


@router.get("/status", response_model=BillingStatusResponse)
async def get_billing_status(
    session: SessionDep,
    organization: OrganizationDep,
) -> BillingStatusResponse:
    return await BillingService().get_organization_billing_status(session, organization)


@router.post("/checkout", response_model=BillingCheckoutResponse)
async def create_checkout(
    session: SessionDep,
    organization: OrganizationDep,
    _: ManageDep,
    request: BillingCheckoutRequest,
) -> BillingCheckoutResponse:
    return await BillingService().create_checkout(session, organization, request)


@router.post("/webhook")
async def handle_payment_webhook(
    session: SessionDep,
    payload: BillingWebhookPayload,
    x_koryxa_webhook_secret: Annotated[str | None, Header(alias="X-Koryxa-Webhook-Secret")] = None,
    authorization: Annotated[str | None, Header(alias="Authorization")] = None,
) -> dict[str, Any]:
    service = BillingService()
    if not service.verify_webhook_auth(authorization, x_koryxa_webhook_secret):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Signature ou secret de webhook KORYXA Payment invalide.",
        )
    return await service.handle_payment_webhook(session, payload)
