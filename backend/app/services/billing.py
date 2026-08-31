from __future__ import annotations

import time
from datetime import UTC, datetime, timedelta
from typing import Any

import httpx
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.errors import ApplicationError
from app.core.logging import get_logger
from app.models.billing import BillingTransaction
from app.models.integrations import WhatsAppAuthorizedSender
from app.models.organization import Organization
from app.schemas.billing import (
    BillingCheckoutRequest,
    BillingCheckoutResponse,
    BillingPlanOffer,
    BillingStatusResponse,
    BillingWebhookPayload,
)

logger = get_logger(__name__)

PLANS_CATALOG: list[BillingPlanOffer] = [
    BillingPlanOffer(
        code="pack_starter_3m",
        name="Starter Solo",
        plan="starter",
        period_months=3,
        amount_minor=19900,
        currency="XOF",
        display_price="19 900 FCFA",
        is_launch_deal=True,
        original_price="29 700 FCFA",
        max_senders=1,
        features=[
            "1 Numéro WhatsApp connecté (Gérant)",
            "Dictée vocale & texte illimitée",
            "Reçus clients automatiques (Texte / PDF)",
            "Rapport de caisse journalier par WhatsApp",
            "Sauvegarde cloud quotidienne chiffrée",
        ],
    ),
    BillingPlanOffer(
        code="pack_business_3m",
        name="Business Multi-Vendeurs",
        plan="business",
        period_months=3,
        amount_minor=39900,
        currency="XOF",
        display_price="39 900 FCFA",
        is_launch_deal=True,
        original_price="59 700 FCFA",
        max_senders=3,
        features=[
            "Jusqu'à 3 Numéros WhatsApp (Gérant + Vendeurs)",
            "Tout le contenu de la formule Starter",
            "Gestion des stocks & Alertes de rupture",
            "Suivi des créances & Relances clients 1-clic",
            "Export comptable Excel / PDF complet",
            "Support prioritaire direct sur WhatsApp",
        ],
    ),
    BillingPlanOffer(
        code="pack_starter_1m",
        name="STARTER Mensuel",
        plan="starter",
        period_months=1,
        amount_minor=9900,
        currency="XOF",
        display_price="9 900 FCFA / mois",
        is_launch_deal=False,
        max_senders=1,
        features=[
            "1 Numéro WhatsApp connecté",
            "Dictée vocale & caisse illimitée",
            "Rapports de caisse journaliers",
        ],
    ),
    BillingPlanOffer(
        code="pack_business_1m",
        name="BUSINESS Mensuel",
        plan="business",
        period_months=1,
        amount_minor=19900,
        currency="XOF",
        display_price="19 900 FCFA / mois",
        is_launch_deal=False,
        max_senders=3,
        features=[
            "Jusqu'à 3 Numéros WhatsApp",
            "Stocks, créances & alertes",
            "Export comptable & Support prioritaire",
        ],
    ),
]


class BillingService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.koryxa_payment_url = (
            self.settings.koryxa_pay_api_url or "https://api-pay.koryxa.fr"
        ).rstrip("/")
        self.project_code = self.settings.koryxa_pay_project_code or "service-ia"
        self.project_key = self.settings.koryxa_pay_project_key

    def get_plan_by_code(self, product_code: str) -> BillingPlanOffer | None:
        return next((p for p in PLANS_CATALOG if p.code == product_code), None)

    async def get_organization_billing_status(
        self, session: AsyncSession, organization: Organization
    ) -> BillingStatusResponse:
        active_senders = (
            await session.scalar(
                select(func.count(WhatsAppAuthorizedSender.id)).where(
                    WhatsAppAuthorizedSender.organization_id == organization.id,
                    WhatsAppAuthorizedSender.is_active.is_(True),
                )
            )
            or 0
        )

        days_remaining: int | None = None
        if organization.subscription_ends_at:
            ends_at = organization.subscription_ends_at
            if ends_at.tzinfo is None:
                ends_at = ends_at.replace(tzinfo=UTC)
            delta = ends_at - datetime.now(UTC)
            days_remaining = max(0, delta.days)

        is_trial = (
            organization.subscription_plan == "trial" or organization.subscription_status == "trial"
        )
        is_active = organization.subscription_status == "active" or (
            is_trial and (days_remaining is None or days_remaining > 0)
        )

        return BillingStatusResponse(
            subscription_plan=organization.subscription_plan or "trial",
            subscription_status=organization.subscription_status or "trial",
            subscription_period_months=organization.subscription_period_months or 3,
            subscription_ends_at=organization.subscription_ends_at,
            days_remaining=days_remaining,
            max_authorized_senders=organization.max_authorized_senders or 3,
            active_senders_count=active_senders,
            is_trial=is_trial,
            is_active=is_active,
            available_plans=PLANS_CATALOG,
        )

    async def create_checkout(
        self,
        session: AsyncSession,
        organization: Organization,
        request: BillingCheckoutRequest,
    ) -> BillingCheckoutResponse:
        plan_offer = self.get_plan_by_code(request.product_code)
        if not plan_offer:
            raise ApplicationError(
                "invalid_plan", f"Offre introuvable pour le code {request.product_code}", 400
            )

        if not self.project_key:
            logger.warning("koryxa_pay_project_key_missing_in_environment")
            raise ApplicationError(
                "payment_gateway_unconfigured",
                "La passerelle de paiement KORYXA n'est pas encore configurée sur ce serveur (clé SERVICE_IA_KORYXA_PAY_PROJECT_KEY manquante).",
                503,
            )

        idempotency_key = f"sub-{organization.id}-{plan_offer.code}-{int(time.time())}"
        resolved_key = self.project_key.get_secret_value()

        payload = {
            "product_code": plan_offer.code,
            "customer_id": organization.id,
            "amount_minor": plan_offer.amount_minor,
            "currency": plan_offer.currency,
            "idempotency_key": idempotency_key,
            "metadata": {
                "description": f"Abonnement Service IA — {plan_offer.name}",
                "customer": {
                    "email": request.customer_email,
                    "phone": request.customer_phone,
                },
            },
        }

        checkout_url: str | None = None
        payment_id: str | None = None

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    f"{self.koryxa_payment_url}/v1/client/checkouts",
                    headers={
                        "Content-Type": "application/json",
                        "X-Project-Code": self.project_code,
                        "X-Project-Key": resolved_key,
                    },
                    json=payload,
                )
                if resp.status_code in (200, 201):
                    data = resp.json()
                    checkout_url = data.get("checkout_url") or data.get("url")
                    payment_id = data.get("payment_id") or data.get("id")
                else:
                    logger.error(
                        "koryxa_payment_checkout_failed",
                        status_code=resp.status_code,
                        response_body=resp.text,
                    )
                    raise ApplicationError(
                        "payment_initiation_failed",
                        f"KORYXA Payment a refusé l'initialisation (HTTP {resp.status_code}): {resp.text}",
                        502,
                    )
        except ApplicationError:
            raise
        except Exception as exc:
            logger.error("koryxa_payment_checkout_network_error", error=str(exc))
            raise ApplicationError(
                "payment_gateway_unavailable",
                f"Impossible de joindre le serveur KORYXA Payment: {exc}",
                503,
            ) from exc

        if not checkout_url:
            raise ApplicationError(
                "invalid_checkout_response",
                "L'orchestrateur de paiement n'a pas retourné d'URL de paiement valide.",
                502,
            )

        tx = BillingTransaction(
            organization_id=organization.id,
            product_code=plan_offer.code,
            plan=plan_offer.plan,
            period_months=plan_offer.period_months,
            amount_minor=plan_offer.amount_minor,
            currency=plan_offer.currency,
            provider="orchestrator",
            status="pending",
            koryxa_payment_id=payment_id,
            checkout_url=checkout_url,
            idempotency_key=idempotency_key,
            customer_phone=request.customer_phone,
            customer_email=request.customer_email,
        )
        session.add(tx)
        await session.commit()

        return BillingCheckoutResponse(
            checkout_url=checkout_url,
            payment_id=payment_id,
            idempotency_key=idempotency_key,
            product_code=plan_offer.code,
            amount_minor=plan_offer.amount_minor,
            currency=plan_offer.currency,
        )

    async def _verify_payment_with_gateway(self, payment_id: str) -> bool:
        if not self.project_key:
            return False
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.koryxa_payment_url}/v1/client/payments/{payment_id}",
                    headers={
                        "X-Project-Code": self.project_code,
                        "X-Project-Key": self.project_key.get_secret_value(),
                    },
                )
            if response.status_code != 200:
                logger.error(
                    "payment_reconciliation_failed",
                    payment_id=payment_id,
                    status=response.status_code,
                )
                return False
            payment_status = str(response.json().get("payment_status", "")).lower()
            return payment_status in {"successful", "succeeded", "completed", "paid"}
        except (httpx.HTTPError, ValueError) as exc:
            logger.error(
                "payment_reconciliation_unavailable", payment_id=payment_id, error=str(exc)
            )
            return False

    async def handle_payment_webhook(
        self, session: AsyncSession, payload: BillingWebhookPayload
    ) -> dict[str, Any]:
        logger.info(
            "received_koryxa_payment_webhook",
            payment_id=payload.payment_id,
            idempotency_key=payload.idempotency_key,
            status=payload.status,
        )

        # 1. Résolution de la transaction
        tx: BillingTransaction | None = None
        if payload.idempotency_key:
            tx = await session.scalar(
                select(BillingTransaction)
                .where(BillingTransaction.idempotency_key == payload.idempotency_key)
                .with_for_update()
            )
        if not tx and payload.payment_id:
            tx = await session.scalar(
                select(BillingTransaction)
                .where(BillingTransaction.koryxa_payment_id == payload.payment_id)
                .with_for_update()
            )

        if not tx:
            logger.warning("webhook_rejected_unknown_transaction", payment_id=payload.payment_id)
            return {"status": "rejected", "reason": "unknown_transaction"}

        org_id = tx.organization_id

        org = await session.get(Organization, org_id)
        if not org:
            logger.warning("webhook_rejected_org_not_found", org_id=org_id)
            return {"status": "ignored", "reason": "organization_not_found"}

        status_lower = (payload.status or "").lower()
        if status_lower in ("successful", "completed", "success", "paid"):
            # 2. Protection Anti-Rejeu (Idempotence Stricte)
            if tx and tx.status in ("completed", "successful"):
                logger.info(
                    "webhook_already_processed", tx_id=tx.id, idempotency_key=tx.idempotency_key
                )
                return {
                    "status": "already_processed",
                    "plan": org.subscription_plan,
                    "organization_id": org.id,
                }

            # 3. Vérification Montant et Devise
            payment_id = payload.payment_id or tx.koryxa_payment_id
            if not payment_id or not await self._verify_payment_with_gateway(payment_id):
                logger.error("webhook_payment_not_confirmed", payment_id=payment_id)
                return {"status": "rejected", "reason": "payment_not_confirmed"}

            plan_code = tx.product_code
            plan_offer = self.get_plan_by_code(plan_code)
            if not plan_offer:
                logger.error("webhook_unknown_plan_code", plan_code=plan_code)
                return {"status": "ignored", "reason": "unknown_plan_code"}

            if payload.product_code and payload.product_code != tx.product_code:
                return {"status": "rejected", "reason": "product_mismatch"}

            if payload.amount_minor is not None and payload.amount_minor != tx.amount_minor:
                logger.error(
                    "webhook_amount_mismatch",
                    expected=tx.amount_minor,
                    received=payload.amount_minor,
                )
                return {"status": "rejected", "reason": "amount_mismatch"}

            if payload.currency and payload.currency.upper() != tx.currency.upper():
                logger.error(
                    "webhook_currency_mismatch",
                    expected=tx.currency,
                    received=payload.currency,
                )
                return {"status": "rejected", "reason": "currency_mismatch"}

            months = plan_offer.period_months
            plan_name = plan_offer.plan
            max_senders = plan_offer.max_senders

            # 4. Calcul d'expiration sécurisé
            now = datetime.now(UTC)
            org_ends = org.subscription_ends_at
            if org_ends and org_ends.tzinfo is None:
                org_ends = org_ends.replace(tzinfo=UTC)

            base_date = org_ends if (org_ends and org_ends > now) else now
            new_expiration = base_date + timedelta(days=months * 30)

            org.subscription_plan = plan_name
            org.subscription_status = "active"
            org.subscription_period_months = months
            org.subscription_ends_at = new_expiration
            org.max_authorized_senders = max(org.max_authorized_senders or 1, max_senders)

            tx.status = "completed"
            tx.completed_at = now
            tx.koryxa_payment_id = payment_id

            await session.commit()
            logger.info(
                "organization_subscription_activated",
                org_id=org.id,
                plan=plan_name,
                ends_at=new_expiration.isoformat(),
            )
            return {
                "status": "success",
                "plan": plan_name,
                "expires_at": new_expiration.isoformat(),
            }

        return {"status": "acknowledged", "payment_status": payload.status}
