from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field


class TelegramConfigRead(BaseModel):
    is_active: bool = True
    link_code: str
    deep_link_url: str
    bot_username: str
    custom_bot_active: bool = False
    custom_bot_username: str | None = None
    has_custom_bot_token: bool = False


class TelegramCustomBotUpdate(BaseModel):
    bot_token: str = Field(..., min_length=10, max_length=200)


class TelegramAuthorizedUserRead(BaseModel):
    id: str
    organization_id: str
    telegram_user_id: str
    telegram_username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    label: str | None = None
    is_active: bool = True
    created_at: datetime


class TelegramAuthorizedUserUpdate(BaseModel):
    label: str | None = None
    is_active: bool = True
