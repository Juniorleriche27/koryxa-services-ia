"""Telegram webhook authentication using per-bot Telegram secret_token.

The public route key identifies an integration, but never authorizes it. Only
Telegram's secret header checked in constant time allows processing updates.
"""
from __future__ import annotations

import hashlib
import hmac

from app.core.config import get_settings


def webhook_secret(config_id: str, bot_token: str) -> str:
    if not config_id or not bot_token:
        raise ValueError("Configuration Telegram incomplète")
    settings = get_settings()
    key = settings.encryption_key
    if not key:
        if settings.environment == "production":
            raise ValueError("Clé de chiffrement indisponible")
        key = "service-ia-development-only-encryption-key"
    return hmac.new(key.encode(), f"telegram-webhook-v1:{config_id}:{bot_token}".encode(), hashlib.sha256).hexdigest()


def verify_webhook_secret(expected: str, received: str | None) -> bool:
    return bool(received) and hmac.compare_digest(expected, received)
