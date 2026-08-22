from functools import lru_cache
from typing import Literal

from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="SERVICE_IA_", extra="ignore")
    environment: Literal["development", "test", "staging", "production"] = "development"
    debug: bool = False
    log_level: str = "INFO"
    api_prefix: str = "/api/v1"
    database_url: str = "postgresql+asyncpg://service_ia:change-me@localhost:5432/service_ia"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])
    require_koryxa_context: bool = True
    proxy_secret: str | None = Field(default=None, min_length=32)
    trusted_proxy_sources: list[str] = Field(
        default_factory=lambda: ["koryxa-gateway", "koryxa-admin", "koryxa-services-ia"]
    )
    file_storage_path: str = "storage/files"
    max_upload_bytes: int = 104_857_600
    smtp_host: str | None = None
    smtp_port: int = 465
    smtp_username: str | None = None
    smtp_password: SecretStr | None = None
    smtp_use_ssl: bool = True
    email_from: str = "notifications@koryxa.fr"
    public_app_url: str = "http://localhost:3000"
    knowlia_base_url: str = "http://localhost:8093"
    knowlia_timeout_seconds: float = 60.0
    knowlia_shared_storage_path: str | None = None

    @model_validator(mode="after")
    def validate_production_security(self) -> "Settings":
        if self.environment == "production" and not self.proxy_secret:
            raise ValueError("SERVICE_IA_PROXY_SECRET est requis en production")
        if self.environment == "production" and not self.cors_origins:
            raise ValueError("SERVICE_IA_CORS_ORIGINS doit contenir au moins une origine")
        if "*" in self.cors_origins:
            raise ValueError("Une origine CORS explicite est requise lorsque les cookies sont autorisés")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
