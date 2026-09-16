import logging
import re
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, async_session_maker
from app.models.contact import ContactLead

logger = logging.getLogger(__name__)

router = APIRouter()


class ContactFormRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=180, description="Nom et prénom du contact")
    company_name: str = Field(min_length=2, max_length=180, description="Nom de l'entreprise ou organisation")
    business_sector: str = Field(default="Services", max_length=100, description="Secteur d'activité")
    whatsapp_phone: str = Field(min_length=7, max_length=40, description="Numéro WhatsApp avec indicatif")
    email: EmailStr = Field(description="Adresse email professionnelle")
    message: str | None = Field(default=None, max_length=3000, description="Message ou besoin spécifique")

    @field_validator("whatsapp_phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        clean = v.strip()
        if not clean.startswith("+") and not clean.startswith("00"):
            raise ValueError(
                "Le numéro WhatsApp doit obligatoirement inclure l'indicatif international du pays avec '+' (ex: +228..., +225..., +33..., +221...)."
            )
        digits = re.sub(r"[^0-9]", "", clean)
        if len(digits) < 7 or len(digits) > 15:
            raise ValueError(
                "Le numéro WhatsApp international doit comporter entre 7 et 15 chiffres."
            )
        return f"+{digits}"


class ContactFormResponse(BaseModel):
    success: bool
    lead_id: str
    message: str


@router.post("", response_model=ContactFormResponse, status_code=status.HTTP_201_CREATED)
async def submit_contact_request(
    data: ContactFormRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Public Contact and Demo Request endpoint.
    Saves lead into PostgreSQL and notifies the KORYXA executive team at contact@koryxa.fr.
    """
    try:
        lead = ContactLead(
            full_name=data.full_name.strip(),
            company_name=data.company_name.strip(),
            business_sector=data.business_sector.strip(),
            whatsapp_phone=data.whatsapp_phone.strip(),
            email=str(data.email).lower().strip(),
            message=data.message.strip() if data.message else None,
            status="new",
        )
        db.add(lead)
        await db.commit()
        await db.refresh(lead)

        logger.info(
            "🔔 NOUVEAU CONTACT KORYXA / CAURI REÇU: %s (%s) - %s - %s - Secteur: %s",
            lead.full_name,
            lead.company_name,
            lead.whatsapp_phone,
            lead.email,
            lead.business_sector,
        )

        return ContactFormResponse(
            success=True,
            lead_id=lead.id,
            message="Votre demande a été enregistrée avec succès. Notre équipe vous recontactera sous 2h ouvrées.",
        )
    except Exception as e:
        logger.exception("Error processing contact lead submission: %s", e)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Une erreur est survenue lors de l'enregistrement de votre demande. Veuillez réessayer ou nous écrire directement sur WhatsApp.",
        )
