from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.identity import KoryxaIdentity, require_koryxa_identity
from app.core.permissions import get_current_organization, require_permission
from app.db.session import get_session
from app.models.member import OrganizationMember
from app.models.organization import Organization
from app.schemas.voice import (
    VoiceConfirmRequest,
    VoiceParseRequest,
    VoiceParseResponse,
    VoiceTranscriptionResponse,
)
from app.services.voice import VoiceService

router = APIRouter()
SessionDep = Annotated[AsyncSession, Depends(get_session)]
IdentityDep = Annotated[KoryxaIdentity, Depends(require_koryxa_identity)]
OrgDep = Annotated[Organization, Depends(get_current_organization)]
ManageDep = Annotated[OrganizationMember, Depends(require_permission("registers:manage"))]

service = VoiceService()


@router.post("/transcribe", response_model=VoiceTranscriptionResponse)
async def transcribe_audio_file(
    _: IdentityDep,
    file: UploadFile = File(...),
):
    """Transcrit fidèlement un fichier audio micro en texte via Whisper AI HD."""
    content = await file.read()
    return await service.transcribe_audio(
        content,
        filename=file.filename or "audio.webm",
        content_type=file.content_type or "audio/webm",
    )


@router.post("/parse", response_model=VoiceParseResponse)
async def parse_voice_transcript(data: VoiceParseRequest, _: IdentityDep):
    """Analyse un enregistrement ou une transcription vocale et extrait les entités métier."""
    return service.parse_transcript(data)


@router.post("/confirm", status_code=201)
async def confirm_voice_record(
    data: VoiceConfirmRequest, s: SessionDep, i: IdentityDep, o: OrgDep, _: ManageDep
):
    """Valide et enregistre définitivement l'objet métier extrait de la voix."""
    return await service.confirm_record(s, o.id, i.user_id, data)
