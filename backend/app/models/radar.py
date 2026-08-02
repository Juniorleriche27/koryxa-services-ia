from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from uuid import uuid4

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class RadarDimension(StrEnum):
    COMPLETENESS = "completeness"
    FRESHNESS = "freshness"
    CONSISTENCY = "consistency"
    TRACEABILITY = "traceability"


class AlertPriority(StrEnum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"


class AlertStatus(StrEnum):
    OPEN = "open"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    IGNORED = "ignored"


class RadarRuleConfig(Base):
    __tablename__ = "radar_rule_configs"
    __table_args__ = (
        UniqueConstraint("organization_id", "rule_code", name="uq_radar_rule_org_code"),
    )
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    rule_code: Mapped[str] = mapped_column(String(100), index=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    priority: Mapped[AlertPriority] = mapped_column(
        Enum(AlertPriority, native_enum=False), default=AlertPriority.NORMAL
    )
    parameters: Mapped[dict[str, object]] = mapped_column(JSON, default=dict)
    updated_by_user_id: Mapped[str] = mapped_column(String(128))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class RadarRun(Base):
    __tablename__ = "radar_runs"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    triggered_by_user_id: Mapped[str] = mapped_column(String(128))
    status: Mapped[str] = mapped_column(String(30), default="completed")
    alerts_created: Mapped[int] = mapped_column(Integer, default=0)
    scores: Mapped[dict[str, float]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )


class RadarAlert(Base):
    __tablename__ = "radar_alerts"
    __table_args__ = (
        UniqueConstraint("organization_id", "fingerprint", name="uq_radar_alert_fingerprint"),
    )
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    run_id: Mapped[str] = mapped_column(ForeignKey("radar_runs.id", ondelete="CASCADE"), index=True)
    rule_code: Mapped[str] = mapped_column(String(100), index=True)
    dimension: Mapped[RadarDimension] = mapped_column(
        Enum(RadarDimension, native_enum=False), index=True
    )
    priority: Mapped[AlertPriority] = mapped_column(
        Enum(AlertPriority, native_enum=False), index=True
    )
    status: Mapped[AlertStatus] = mapped_column(
        Enum(AlertStatus, native_enum=False), default=AlertStatus.OPEN, index=True
    )
    record_type: Mapped[str] = mapped_column(String(40), index=True)
    record_id: Mapped[str] = mapped_column(String(36), index=True)
    title: Mapped[str] = mapped_column(String(220))
    explanation: Mapped[str] = mapped_column(Text)
    recommendation: Mapped[str] = mapped_column(Text)
    evidence: Mapped[dict[str, object]] = mapped_column(JSON, default=dict)
    confidence: Mapped[float] = mapped_column(Float, default=1.0)
    fingerprint: Mapped[str] = mapped_column(String(180), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class RadarDocumentFact(Base):
    __tablename__ = "radar_document_facts"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    record_type: Mapped[str] = mapped_column(String(40), index=True)
    record_id: Mapped[str] = mapped_column(String(36), index=True)
    field_name: Mapped[str] = mapped_column(String(100), index=True)
    value: Mapped[str] = mapped_column(Text)
    source_attachment_id: Mapped[str | None] = mapped_column(
        ForeignKey("attachments.id", ondelete="SET NULL"), index=True
    )
    confidence: Mapped[float] = mapped_column(Float, default=1.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
