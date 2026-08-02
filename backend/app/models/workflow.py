from __future__ import annotations

from datetime import date, datetime
from enum import StrEnum
from uuid import uuid4

from sqlalchemy import JSON, Date, DateTime, Enum, Float, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.radar import AlertPriority


class ValidationStatus(StrEnum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    CORRECTED = "corrected"
    REJECTED = "rejected"


class ActionStatus(StrEnum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    BLOCKED = "blocked"
    COMPLETED = "completed"
    IGNORED = "ignored"


class ValidationRequest(Base):
    __tablename__ = "validation_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    record_type: Mapped[str] = mapped_column(String(40), index=True)
    record_id: Mapped[str] = mapped_column(String(36), index=True)
    field_name: Mapped[str] = mapped_column(String(100), index=True)
    old_value: Mapped[object | None] = mapped_column(JSON)
    proposed_value: Mapped[object | None] = mapped_column(JSON)
    final_value: Mapped[object | None] = mapped_column(JSON)
    source_type: Mapped[str] = mapped_column(String(60))
    source_reference: Mapped[str | None] = mapped_column(String(255))
    source_author_user_id: Mapped[str | None] = mapped_column(String(128))
    confidence: Mapped[float] = mapped_column(Float, default=1.0)
    status: Mapped[ValidationStatus] = mapped_column(
        Enum(ValidationStatus, native_enum=False),
        default=ValidationStatus.PENDING,
        index=True,
    )
    requested_by_user_id: Mapped[str] = mapped_column(String(128))
    decided_by_user_id: Mapped[str | None] = mapped_column(String(128))
    justification: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class CorrectiveAction(Base):
    __tablename__ = "corrective_actions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    alert_id: Mapped[str | None] = mapped_column(
        ForeignKey("radar_alerts.id", ondelete="SET NULL"), index=True
    )
    record_type: Mapped[str | None] = mapped_column(String(40), index=True)
    record_id: Mapped[str | None] = mapped_column(String(36), index=True)
    title: Mapped[str] = mapped_column(String(220))
    description: Mapped[str | None] = mapped_column(Text)
    priority: Mapped[AlertPriority] = mapped_column(
        Enum(AlertPriority, native_enum=False), default=AlertPriority.NORMAL, index=True
    )
    status: Mapped[ActionStatus] = mapped_column(
        Enum(ActionStatus, native_enum=False), default=ActionStatus.TODO, index=True
    )
    responsible_user_id: Mapped[str | None] = mapped_column(String(128), index=True)
    due_date: Mapped[date | None] = mapped_column(Date, index=True)
    resolution_evidence: Mapped[dict[str, object]] = mapped_column(JSON, default=dict)
    resolution_comment: Mapped[str | None] = mapped_column(Text)
    created_by_user_id: Mapped[str] = mapped_column(String(128))
    completed_by_user_id: Mapped[str | None] = mapped_column(String(128))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class ActionComment(Base):
    __tablename__ = "action_comments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    action_id: Mapped[str] = mapped_column(
        ForeignKey("corrective_actions.id", ondelete="CASCADE"), index=True
    )
    author_user_id: Mapped[str] = mapped_column(String(128), index=True)
    body: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    entity_type: Mapped[str] = mapped_column(String(60), index=True)
    entity_id: Mapped[str] = mapped_column(String(36), index=True)
    event_type: Mapped[str] = mapped_column(String(80), index=True)
    actor_user_id: Mapped[str] = mapped_column(String(128), index=True)
    payload: Mapped[dict[str, object]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
