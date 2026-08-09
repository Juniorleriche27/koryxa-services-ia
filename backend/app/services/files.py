# mypy: disable-error-code="attr-defined"
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.errors import ApplicationError
from app.models.imports import Attachment
from app.models.registers import Offer, Procedure, Sale
from app.storage.local import LocalFileStorage

ALLOWED_DOCUMENT_EXTENSIONS = {
    "csv", "doc", "docx", "jpeg", "jpg", "json", "pdf", "png", "ppt", "pptx",
    "txt", "webp", "xls", "xlsx", "zip",
}


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
            raise ApplicationError("file_too_large", "Le fichier dépasse la limite de 100 Mo", 413)
        extension = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
        if extension not in ALLOWED_DOCUMENT_EXTENSIONS or not self._has_valid_signature(extension, content):
            raise ApplicationError(
                "unsupported_file",
                "Format non accepté ou contenu du fichier invalide",
                415,
            )
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

    @staticmethod
    def _has_valid_signature(extension: str, content: bytes) -> bool:
        if not content:
            return False
        signatures = {
            "pdf": lambda value: value.startswith(b"%PDF"),
            "png": lambda value: value.startswith(b"\x89PNG\r\n\x1a\n"),
            "jpg": lambda value: value.startswith(b"\xff\xd8\xff"),
            "jpeg": lambda value: value.startswith(b"\xff\xd8\xff"),
            "webp": lambda value: len(value) >= 12 and value[:4] == b"RIFF" and value[8:12] == b"WEBP",
        }
        if extension in signatures:
            return signatures[extension](content)
        if extension in {"docx", "xlsx", "pptx", "zip"}:
            return content.startswith(b"PK\x03\x04")
        if extension in {"doc", "xls", "ppt"}:
            return content.startswith(b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1")
        if extension in {"csv", "json", "txt"}:
            sample = content[:4096]
            return b"\x00" not in sample
        return False

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

    async def download(
        self,
        session: AsyncSession,
        organization_id: str,
        attachment_id: str,
    ) -> tuple[Attachment, bytes]:
        attachment = await session.scalar(
            select(Attachment).where(
                Attachment.id == attachment_id,
                Attachment.organization_id == organization_id,
            )
        )
        if attachment is None:
            raise ApplicationError("attachment_not_found", "Pièce jointe introuvable", 404)
        try:
            content = self.storage.read(attachment.storage_key)
        except (OSError, ValueError) as exc:
            raise ApplicationError(
                "attachment_unavailable", "Le fichier est indisponible", 404
            ) from exc
        return attachment, content

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
