from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.types import SafeStrEnum


class MemberRole(StrEnum):
    OWNER = "owner"
    MANAGER = "manager"
    CONTRIBUTOR = "contributor"


class MemberStatus(StrEnum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    REMOVED = "removed"


class OrganizationMember(Base):
    __tablename__ = "organization_members"
    __table_args__ = (UniqueConstraint("organization_id", "user_id", name="uq_org_member_user"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    role: Mapped[MemberRole] = mapped_column(SafeStrEnum(MemberRole, length=20), nullable=False)
    status: Mapped[MemberStatus] = mapped_column(
        SafeStrEnum(MemberStatus, length=20), default=MemberStatus.ACTIVE, nullable=False
    )
    invited_by_user_id: Mapped[str | None] = mapped_column(String(128))
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    organization = relationship("Organization", back_populates="members")
