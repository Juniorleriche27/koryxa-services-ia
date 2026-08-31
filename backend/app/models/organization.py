from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    tenant_id: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(180), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    logo_storage_key: Mapped[str | None] = mapped_column(String(500))
    logo_content_type: Mapped[str | None] = mapped_column(String(100))
    logo_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    sector: Mapped[str | None] = mapped_column(String(120))
    country: Mapped[str | None] = mapped_column(String(120))
    responsible_name: Mapped[str | None] = mapped_column(String(180))
    responsible_role: Mapped[str | None] = mapped_column(String(120))
    primary_goal: Mapped[str | None] = mapped_column(String(50))
    business_category: Mapped[str] = mapped_column(
        String(40), default="retail", index=True, nullable=False
    )
    latitude: Mapped[float | None] = mapped_column(nullable=True)
    longitude: Mapped[float | None] = mapped_column(nullable=True)
    geofence_radius_meters: Mapped[int] = mapped_column(default=50, nullable=False)
    onboarding_completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    subscription_plan: Mapped[str] = mapped_column(String(40), default="trial", nullable=False)
    subscription_status: Mapped[str] = mapped_column(String(40), default="trial", nullable=False)
    subscription_period_months: Mapped[int] = mapped_column(default=3, nullable=False)
    subscription_ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    max_authorized_senders: Mapped[int] = mapped_column(default=3, nullable=False)
    created_by_user_id: Mapped[str] = mapped_column(String(128), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    members = relationship(
        "OrganizationMember", back_populates="organization", cascade="all, delete-orphan"
    )
    invitations = relationship(
        "OrganizationInvitation", back_populates="organization", cascade="all, delete-orphan"
    )
