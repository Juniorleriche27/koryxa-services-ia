from functools import lru_cache
from typing import Literal

from pydantic import Field
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
    file_storage_path: str = "storage/files"
    max_upload_bytes: int = 10_485_760
    knowlia_base_url: str = "http://localhost:8093"
    knowlia_timeout_seconds: float = 30.0


@lru_cache
def get_settings() -> Settings:
    return Settings()
