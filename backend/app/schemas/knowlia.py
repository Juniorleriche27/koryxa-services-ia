from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.knowlia import KnowliaSyncStatus


class KnowliaSyncCreate(BaseModel):
    attachment_id: str
    idempotency_key: str = Field(min_length=8, max_length=160)
    project_id: str | None = None
    assistant_id: str | None = None
    folder_id: str | None = None
    max_chunk_chars: int | None = Field(default=None, ge=200, le=6000)


class KnowliaSyncRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    attachment_id: str
    idempotency_key: str
    knowlia_document_id: str | None
    knowlia_job_id: str | None
    status: KnowliaSyncStatus
    attempts: int
    last_error: str | None
    response_payload: dict[str, object]
    created_at: datetime
    updated_at: datetime


class KnowliaStatusRead(BaseModel):
    sync: KnowliaSyncRead
    knowlia_status: dict[str, object] | None = None
