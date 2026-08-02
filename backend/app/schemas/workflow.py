from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.radar import AlertPriority
from app.models.workflow import ActionStatus, ValidationStatus


class ValidationCreate(BaseModel):
    record_type: str
    record_id: str
    field_name: str
    old_value: object | None = None
    proposed_value: object | None = None
    source_type: str
    source_reference: str | None = None
    source_author_user_id: str | None = None
    confidence: float = Field(default=1.0, ge=0, le=1)


class ValidationDecision(BaseModel):
    decision: ValidationStatus
    corrected_value: object | None = None
    justification: str = Field(min_length=2, max_length=2000)


class ValidationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    record_type: str
    record_id: str
    field_name: str
    old_value: object | None
    proposed_value: object | None
    final_value: object | None
    source_type: str
    source_reference: str | None
    source_author_user_id: str | None
    confidence: float
    status: ValidationStatus
    requested_by_user_id: str
    decided_by_user_id: str | None
    justification: str | None
    created_at: datetime
    decided_at: datetime | None


class ActionCreate(BaseModel):
    alert_id: str | None = None
    record_type: str | None = None
    record_id: str | None = None
    title: str = Field(min_length=2, max_length=220)
    description: str | None = None
    priority: AlertPriority = AlertPriority.NORMAL
    responsible_user_id: str | None = None
    due_date: date | None = None


class ActionUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=220)
    description: str | None = None
    priority: AlertPriority | None = None
    status: ActionStatus | None = None
    responsible_user_id: str | None = None
    due_date: date | None = None
    resolution_evidence: dict[str, object] | None = None
    resolution_comment: str | None = None


class ActionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    alert_id: str | None
    record_type: str | None
    record_id: str | None
    title: str
    description: str | None
    priority: AlertPriority
    status: ActionStatus
    responsible_user_id: str | None
    due_date: date | None
    resolution_evidence: dict[str, object]
    resolution_comment: str | None
    created_by_user_id: str
    completed_by_user_id: str | None
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None


class CommentCreate(BaseModel):
    body: str = Field(min_length=1, max_length=4000)


class CommentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    action_id: str
    author_user_id: str
    body: str
    created_at: datetime


class AuditEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    entity_type: str
    entity_id: str
    event_type: str
    actor_user_id: str
    payload: dict[str, object]
    created_at: datetime
