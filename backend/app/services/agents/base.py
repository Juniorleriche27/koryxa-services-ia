from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession


class BaseSpecializedAgent(ABC):
    """Classe de base pour tous les sous-agents d'expertise métier."""

    def __init__(self, name: str, badge: str, role_title: str) -> None:
        self.name = name
        self.badge = badge
        self.role_title = role_title

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
    ) -> dict[str, Any]:
        """Traite une demande et retourne la réponse soignée avec actions éventuelles."""
        pass
