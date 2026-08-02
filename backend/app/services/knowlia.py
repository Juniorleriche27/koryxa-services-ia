from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ApplicationError
from app.core.identity import KoryxaIdentity
from app.integrations.knowlia import KnowliaClient
from app.models.imports import Attachment
from app.models.knowlia import KnowliaSyncJob, KnowliaSyncStatus
from app.schemas.knowlia import KnowliaSyncCreate


class KnowliaSyncService:
    def __init__(self, client: KnowliaClient | None = None) -> None:
        self.client = client or KnowliaClient()

    async def create(
        self,
        s: AsyncSession,
        org: str,
        identity: KoryxaIdentity,
        data: KnowliaSyncCreate,
        request_id: str | None = None,
    ) -> KnowliaSyncJob:
        existing = await s.scalar(
            select(KnowliaSyncJob).where(
                KnowliaSyncJob.organization_id == org,
                KnowliaSyncJob.idempotency_key == data.idempotency_key,
            )
        )
        if existing:
            return existing
        attachment = await s.scalar(
            select(Attachment).where(
                Attachment.id == data.attachment_id, Attachment.organization_id == org
            )
        )
        if not attachment:
            raise ApplicationError("attachment_not_found", "Pièce jointe introuvable", 404)
        job = KnowliaSyncJob(
            organization_id=org,
            attachment_id=attachment.id,
            idempotency_key=data.idempotency_key,
            requested_by_user_id=identity.user_id,
        )
        s.add(job)
        await s.flush()
        try:
            document = await self.client.register_document(
                identity,
                {
                    "display_name": attachment.filename,
                    "path": attachment.storage_key,
                    "assistant_id": data.assistant_id,
                    "project_id": data.project_id,
                    "folder_id": data.folder_id,
                    "mime_type": attachment.content_type,
                    "size_bytes": attachment.size_bytes,
                    "metadata": {
                        "service_ia_attachment_id": attachment.id,
                        "register_type": attachment.register_type,
                        "record_id": attachment.record_id,
                    },
                },
                request_id,
            )
            job.knowlia_document_id = str(document["document_id"])
            job.status = KnowliaSyncStatus.REGISTERED
            job.attempts += 1
            ingestion = await self.client.start_ingestion(
                identity, job.knowlia_document_id, data.max_chunk_chars, request_id
            )
            job.knowlia_job_id = str(ingestion.get("job_id") or "") or None
            job.status = KnowliaSyncStatus.INGESTING
            job.response_payload = {"document": document, "ingestion": ingestion}
            job.last_error = None
        except ApplicationError as exc:
            job.status = KnowliaSyncStatus.FAILED
            job.attempts += 1
            job.last_error = exc.message
        await s.commit()
        await s.refresh(job)
        return job

    async def get(self, s: AsyncSession, org: str, sync_id: str) -> KnowliaSyncJob:
        job = await s.scalar(
            select(KnowliaSyncJob).where(
                KnowliaSyncJob.id == sync_id, KnowliaSyncJob.organization_id == org
            )
        )
        if not job:
            raise ApplicationError("sync_not_found", "Synchronisation introuvable", 404)
        return job

    async def refresh(
        self,
        s: AsyncSession,
        org: str,
        identity: KoryxaIdentity,
        sync_id: str,
        request_id: str | None = None,
    ) -> tuple[KnowliaSyncJob, dict[str, object] | None]:
        job = await self.get(s, org, sync_id)
        if not job.knowlia_document_id:
            return job, None
        try:
            status = await self.client.get_ingestion_status(
                identity, job.knowlia_document_id, request_id
            )
            raw = str(status.get("status") or "").lower()
            job.status = (
                KnowliaSyncStatus.COMPLETED
                if raw in {"completed", "ingested", "success"}
                else KnowliaSyncStatus.INGESTING
            )
            job.response_payload = {**job.response_payload, "status": status}
            job.last_error = None
        except ApplicationError as exc:
            job.status = KnowliaSyncStatus.FAILED
            job.last_error = exc.message
            status = None
        await s.commit()
        await s.refresh(job)
        return job, status

    async def retry(
        self,
        s: AsyncSession,
        org: str,
        identity: KoryxaIdentity,
        sync_id: str,
        request_id: str | None = None,
    ) -> KnowliaSyncJob:
        job = await self.get(s, org, sync_id)
        if job.status != KnowliaSyncStatus.FAILED:
            raise ApplicationError(
                "retry_unavailable", "Seule une synchronisation échouée peut être relancée", 409
            )
        attachment = await s.scalar(
            select(Attachment).where(
                Attachment.id == job.attachment_id, Attachment.organization_id == org
            )
        )
        assert attachment is not None
        try:
            if not job.knowlia_document_id:
                document = await self.client.register_document(
                    identity,
                    {
                        "display_name": attachment.filename,
                        "path": attachment.storage_key,
                        "mime_type": attachment.content_type,
                        "size_bytes": attachment.size_bytes,
                        "metadata": {"service_ia_attachment_id": attachment.id},
                    },
                    request_id,
                )
                job.knowlia_document_id = str(document["document_id"])
            ingestion = await self.client.start_ingestion(
                identity, job.knowlia_document_id, None, request_id
            )
            job.knowlia_job_id = str(ingestion.get("job_id") or "") or None
            job.status = KnowliaSyncStatus.INGESTING
            job.response_payload = {"ingestion": ingestion}
            job.last_error = None
        except ApplicationError as exc:
            job.status = KnowliaSyncStatus.FAILED
            job.last_error = exc.message
        job.attempts += 1
        await s.commit()
        await s.refresh(job)
        return job
