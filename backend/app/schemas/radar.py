from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.radar import AlertPriority, AlertStatus, RadarDimension


class RadarRuleConfigUpdate(BaseModel):
    enabled: bool = True
    priority: AlertPriority = AlertPriority.NORMAL
    parameters: dict[str, object] = Field(default_factory=dict)


class RadarRuleConfigRead(RadarRuleConfigUpdate):
    model_config = ConfigDict(from_attributes=True)
    id: str
    rule_code: str
    created_at: datetime
    updated_at: datetime


class RadarRunRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    status: str
    alerts_created: int
    scores: dict[str, float]
    created_at: datetime


class RadarAlertRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    run_id: str
    rule_code: str
    dimension: RadarDimension
    priority: AlertPriority
    status: AlertStatus
    record_type: str
    record_id: str
    title: str
    explanation: str
    recommendation: str
    evidence: dict[str, object]
    confidence: float
    created_at: datetime
    updated_at: datetime


class RadarAlertStatusUpdate(BaseModel):
    status: AlertStatus


class RadarDocumentFactCreate(BaseModel):
    record_type: str
    record_id: str
    field_name: str
    value: str
    source_attachment_id: str | None = None
    confidence: float = Field(default=1.0, ge=0, le=1)


class RadarDocumentFactRead(RadarDocumentFactCreate):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: datetime
