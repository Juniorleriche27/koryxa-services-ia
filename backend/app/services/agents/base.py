from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.identity import KoryxaIdentity
from app.integrations.knowlia import KnowliaClient
from app.models.organization import Organization
from app.services.integration_config import IntegrationConfigService


class BaseSpecializedAgent(ABC):
    """Classe de base industrielle pour tous les agents experts du Service IA."""

    def __init__(self, name: str, badge: str, role_title: str, system_prompt: str = "") -> None:
        self.name = name
        self.badge = badge
        self.role_title = role_title
        self.system_prompt = system_prompt
        self.knowlia = KnowliaClient()
        self.configs = IntegrationConfigService()

    @abstractmethod
    async def process(
        self,
        s: AsyncSession,
        org: str,
        user: str,
        user_message: str,
        context: dict[str, Any],
        org_name: str,
        currency: str,
        domain: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Traite une demande et retourne la réponse soignée avec actions éventuelles."""
        pass

    async def call_knowlia_llm(
        self,
        s: AsyncSession,
        org_id: str,
        user_id: str,
        prompt: str,
    ) -> str | None:
        """Interroge le moteur LLM Knowlia pour le raisonnement de haut niveau."""
        try:
            organization = await s.get(Organization, org_id)
            if not organization:
                return None
            cfg = await self.configs.get(s, org_id)
            identity = KoryxaIdentity(
                tenant_id=organization.tenant_id,
                user_id=user_id,
                email=None,
                source="service-ia",
                auth_provider="koryxa-admin",
                role="admin",
                permissions=frozenset(),
            )
            if not cfg.knowlia_assistant_id:
                created = await self.knowlia.create_assistant(
                    identity, f"Cora Copilot - {organization.name}"
                )
                cfg.knowlia_assistant_id = str(
                    created.get("id") or created.get("assistant_id") or ""
                )
                if cfg.knowlia_assistant_id:
                    await s.commit()

            if cfg.knowlia_assistant_id:
                res = await self.knowlia.chat(
                    identity, cfg.knowlia_assistant_id, prompt, cfg.ai_model_name
                )
                raw_ans = str(res.get("answer") or "").strip()
                if raw_ans:
                    # Clean out raw double asterisks if LLM produced them
                    return raw_ans.replace("**", "")
        except Exception:
            return None
        return None
