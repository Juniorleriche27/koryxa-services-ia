"""Append-only financial audit evidence written in the business transaction."""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.finance import FinancialAuditEvent


def _json_value(value: Any) -> Any:
    if isinstance(value, Decimal | date | datetime | Enum):
        return str(getattr(value, "value", value))
    if isinstance(value, dict):
        return {str(key): _json_value(item) for key, item in value.items()}
    if isinstance(value, list | tuple):
        return [_json_value(item) for item in value]
    return value


def add_financial_audit(
    session: AsyncSession,
    *, organization_id: str,
    entity_type: str,
    entity_id: str,
    event_type: str,
    actor_user_id: str,
    payload: dict[str, Any] | None = None,
) -> None:
    session.add(FinancialAuditEvent(
        organization_id=organization_id,
        entity_type=entity_type,
        entity_id=entity_id,
        event_type=event_type,
        actor_user_id=actor_user_id,
        payload=_json_value(payload or {}),
    ))
