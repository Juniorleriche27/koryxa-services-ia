from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.imports import ImportStatus


class ImportPreview(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    register_type: str
    filename: str
    status: ImportStatus
    detected_headers: list[str]
    suggested_mapping: dict[str, str]
    preview_rows: list[dict[str, object]]
    errors: list[dict[str, object]]
    duplicate_rows: list[int]
    row_count: int


class ImportConfirm(BaseModel):
    column_mapping: dict[str, str] = Field(min_length=1)


class ImportJobRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    register_type: str
    filename: str
    status: ImportStatus
    column_mapping: dict[str, str]
    errors: list[dict[str, object]]
    duplicate_rows: list[int]
    imported_record_ids: list[str]
    row_count: int
    created_at: datetime
    completed_at: datetime | None
    failure_reason: str | None


class AttachmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    register_type: str
    record_id: str
    filename: str
    content_type: str
    size_bytes: int
    created_at: datetime
