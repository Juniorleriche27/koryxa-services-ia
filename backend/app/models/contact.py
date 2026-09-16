import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ContactLead(Base):
    __tablename__ = "contact_leads"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    full_name: Mapped[str] = mapped_column(String(180), nullable=False)
    company_name: Mapped[str] = mapped_column(String(180), nullable=False)
    business_sector: Mapped[str] = mapped_column(String(100), nullable=False, default="Services")
    whatsapp_phone: Mapped[str] = mapped_column(String(40), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="new")
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
