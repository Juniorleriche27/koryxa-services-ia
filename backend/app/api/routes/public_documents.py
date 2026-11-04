from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.schemas.registers import (
    PublicDocumentPayRequest,
    PublicDocumentPaymentResponse,
    PublicDocumentRead,
    PublicDocumentSignRequest,
)
from app.services.registers import RegisterService

router = APIRouter()
SessionDep = Annotated[AsyncSession, Depends(get_session)]
svc = RegisterService()


@router.get("/{token}", response_model=PublicDocumentRead)
async def get_public_document(token: str, s: SessionDep):
    """
    Publicly accessible endpoint for customers to view their smart live document
    (quote, invoice, receipt) via a unique token without authentication.
    Automatically logs live view telemetry for the merchant.
    """
    return await svc.get_public_document(s, token, increment_view=True)


@router.post("/{token}/sign", response_model=PublicDocumentRead)
async def sign_public_document(token: str, data: PublicDocumentSignRequest, s: SessionDep):
    """
    Allows the customer to electronically sign their quote or contract with tactile signature.
    """
    return await svc.sign_public_document(s, token, data)


@router.post("/{token}/pay", response_model=PublicDocumentPaymentResponse)
async def pay_public_document(token: str, data: PublicDocumentPayRequest, s: SessionDep):
    """
    Instant 1-Click Mobile Money & Card payment gateway for quotes and invoices.
    """
    doc, tx_id = await svc.pay_public_document(s, token, data)
    return PublicDocumentPaymentResponse(
        success=True,
        transaction_id=tx_id,
        document=doc,
        message="Règlement validé avec succès par la Mémoire Opérationnelle CAURI.",
    )
