from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from uuid import uuid4

from sqlalchemy import (
    JSON,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class KnowliaSyncStatus(StrEnum):
    PENDING = "pending"
    REGISTERED = "registered"
    INGESTING = "ingesting"
    COMPLETED = "completed"
    FAILED = "failed"


class KnowliaSyncJob(Base):
    __tablename__ = "knowlia_sync_jobs"
    __table_args__ = (
        UniqueConstraint("organization_id", "idempotency_key", name="uq_knowlia_sync_idempotency"),
    )
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    attachment_id: Mapped[str] = mapped_column(
        ForeignKey("attachments.id", ondelete="CASCADE"), index=True
    )
    idempotency_key: Mapped[str] = mapped_column(String(160), index=True)
    knowlia_document_id: Mapped[str | None] = mapped_column(String(80), index=True)
    knowlia_job_id: Mapped[str | None] = mapped_column(String(80), index=True)
    status: Mapped[KnowliaSyncStatus] = mapped_column(
        Enum(KnowliaSyncStatus, native_enum=False), default=KnowliaSyncStatus.PENDING, index=True
    )
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    last_error: Mapped[str | None] = mapped_column(Text)
    response_payload: Mapped[dict[str, object]] = mapped_column(JSON, default=dict)
    requested_by_user_id: Mapped[str] = mapped_column(String(128))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
