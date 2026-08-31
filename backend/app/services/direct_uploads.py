from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
from typing import Any

from app.core.config import get_settings
from app.core.errors import ApplicationError


class DirectUploadTokenService:
    lifetime_seconds = 5 * 60

    def create(self, claims: dict[str, str]) -> tuple[str, int]:
        expires_at = int(time.time()) + self.lifetime_seconds
        payload = {**claims, "exp": expires_at}
        encoded = self._encode(json.dumps(payload, separators=(",", ":")).encode())
        signature = self._sign(encoded)
        return f"{encoded}.{signature}", expires_at

    def verify(self, token: str, expected_kind: str) -> dict[str, Any]:
        try:
            encoded, signature = token.split(".", 1)
            if not hmac.compare_digest(signature, self._sign(encoded)):
                raise ValueError
            payload = json.loads(self._decode(encoded))
        except (ValueError, TypeError, json.JSONDecodeError) as exc:
            raise ApplicationError("invalid_upload_token", "Jeton d’envoi invalide", 401) from exc
        if payload.get("kind") != expected_kind or int(payload.get("exp", 0)) < int(time.time()):
            raise ApplicationError("expired_upload_token", "Jeton d’envoi expiré", 401)
        return payload

    def _sign(self, value: str) -> str:
        settings = get_settings()
        secret = settings.proxy_secret
        if not secret and settings.environment != "production":
            secret = "service-ia-development-only-secret"
        if not secret:
            raise ApplicationError(
                "upload_signing_unavailable", "Signature d’envoi indisponible", 503
            )
        digest = hmac.new(
            secret.encode(),
            value.encode(),
            hashlib.sha256,
        ).digest()
        return self._encode(digest)

    @staticmethod
    def _encode(value: bytes) -> str:
        return base64.urlsafe_b64encode(value).decode().rstrip("=")

    @staticmethod
    def _decode(value: str) -> bytes:
        return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))
