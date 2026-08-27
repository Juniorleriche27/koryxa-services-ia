from base64 import urlsafe_b64encode
from hashlib import sha256

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import get_settings
from app.core.errors import ApplicationError


class SecretCipher:
    def __init__(self) -> None:
        settings = get_settings()
        secret = settings.encryption_key
        if not secret and settings.environment != "production":
            secret = "service-ia-development-only-encryption-key"
        if not secret:
            raise ApplicationError("encryption_unavailable", "Clé de chiffrement SERVICE_IA_ENCRYPTION_KEY indisponible", 503)
        self.fernet = Fernet(urlsafe_b64encode(sha256(secret.encode()).digest()))

    def encrypt(self, value: str | None) -> str | None:
        return self.fernet.encrypt(value.encode()).decode() if value else None

    def decrypt(self, value: str | None) -> str | None:
        if not value:
            return None
        try:
            return self.fernet.decrypt(value.encode()).decode()
        except InvalidToken as exc:
            raise ApplicationError(
                "secret_decryption_failed", "Secret d’intégration illisible", 500
            ) from exc
