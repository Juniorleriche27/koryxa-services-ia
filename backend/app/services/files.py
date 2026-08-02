# mypy: disable-error-code="attr-defined"
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.errors import ApplicationError
from app.models.imports import Attachment
from app.models.registers import Offer, Procedure, Sale
from app.storage.local import LocalFileStorage


class FileService:
    def __init__(self) -> None:
        self.storage = LocalFileStorage(get_settings().file_storage_path)

    async def upload(
        self,
        session: AsyncSession,
        organization_id: str,
        user_id: str,
        register_type: str,
        record_id: str,
        filename: str,
        content_type: str,
        content: bytes,
    ) -> Attachment:
        settings = get_settings()
        if len(content) > settings.max_upload_bytes:
            raise ApplicationError("file_too_large", "Fichier trop volumineux", 413)
        await self._ensure_record_exists(
            session,
            organization_id,
            register_type,
            record_id,
        )
        storage_key = self.storage.save(organization_id, filename, content)
        attachment = Attachment(
            organization_id=organization_id,
            register_type=register_type,
            record_id=record_id,
            filename=filename,
            content_type=content_type,
            size_bytes=len(content),
            storage_key=storage_key,
            uploaded_by_user_id=user_id,
        )
        session.add(attachment)
        await session.commit()
        await session.refresh(attachment)
        return attachment

    async def list(
        self,
        session: AsyncSession,
        organization_id: str,
        register_type: str,
        record_id: str,
    ) -> list[Attachment]:
        await self._ensure_record_exists(
            session,
            organization_id,
            register_type,
            record_id,
        )
        result = await session.scalars(
            select(Attachment).where(
                Attachment.organization_id == organization_id,
                Attachment.register_type == register_type,
                Attachment.record_id == record_id,
            )
        )
        return list(result.all())

    async def _ensure_record_exists(
        self,
        session: AsyncSession,
        organization_id: str,
        register_type: str,
        record_id: str,
    ) -> None:
        model = {
            "offers": Offer,
            "sales": Sale,
            "procedures": Procedure,
        }.get(register_type)
        if model is None:
            raise ApplicationError("invalid_register", "Registre invalide", 400)
        record = await session.scalar(
            select(model.id).where(
                model.id == record_id,
                model.organization_id == organization_id,
            )
        )
        if record is None:
            raise ApplicationError("record_not_found", "Enregistrement introuvable", 404)
