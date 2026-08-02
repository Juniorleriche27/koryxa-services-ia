# mypy: disable-error-code="no-untyped-def,no-untyped-call,attr-defined"
# ruff: noqa: B008
import csv
import io
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Query, Response, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.identity import KoryxaIdentity, require_koryxa_identity
from app.core.permissions import get_current_organization, require_permission
from app.db.session import get_session
from app.models.member import OrganizationMember
from app.models.organization import Organization
from app.models.registers import Offer, Procedure, Sale
from app.schemas.imports import AttachmentRead, ImportConfirm, ImportJobRead, ImportPreview
from app.services.files import FileService
from app.services.imports import ImportService

router = APIRouter()
SessionDep = Annotated[AsyncSession, Depends(get_session)]
IdentityDep = Annotated[KoryxaIdentity, Depends(require_koryxa_identity)]
OrgDep = Annotated[Organization, Depends(get_current_organization)]
ReadDep = Annotated[OrganizationMember, Depends(require_permission("registers:read"))]
ManageDep = Annotated[OrganizationMember, Depends(require_permission("registers:manage"))]


@router.post("/preview", response_model=ImportPreview)
async def preview(
    session: SessionDep,
    identity: IdentityDep,
    organization: OrgDep,
    _: ManageDep,
    register_type: str = Form(...),
    file: UploadFile = File(...),
) -> ImportPreview:
    content = await file.read()
    job, headers, mapping = await ImportService().preview(
        session,
        organization.id,
        identity.user_id,
        register_type,
        file.filename or "import.csv",
        content,
    )
    return ImportPreview(
        id=job.id,
        register_type=job.register_type,
        filename=job.filename,
        status=job.status,
        detected_headers=headers,
        suggested_mapping=mapping,
        preview_rows=job.preview_rows[:10],
        errors=job.errors,
        duplicate_rows=job.duplicate_rows,
        row_count=job.row_count,
    )


@router.post("/{job_id}/confirm", response_model=ImportJobRead)
async def confirm(
    job_id: str,
    data: ImportConfirm,
    session: SessionDep,
    identity: IdentityDep,
    organization: OrgDep,
    _: ManageDep,
) -> ImportJobRead:
    job = await ImportService().confirm(
        session,
        organization.id,
        identity.user_id,
        job_id,
        data.column_mapping,
    )
    return ImportJobRead.model_validate(job)


@router.post("/{job_id}/rollback", response_model=ImportJobRead)
async def rollback(
    job_id: str,
    session: SessionDep,
    organization: OrgDep,
    _: ManageDep,
) -> ImportJobRead:
    job = await ImportService().rollback(session, organization.id, job_id)
    return ImportJobRead.model_validate(job)


@router.get("/export/{register_type}", response_model=None)
async def export(
    register_type: str,
    session: SessionDep,
    organization: OrgDep,
    _: ReadDep,
) -> StreamingResponse | Response:
    model = {"offers": Offer, "sales": Sale, "procedures": Procedure}.get(register_type)
    if model is None:
        return Response(status_code=404)
    rows = list(
        (
            await session.scalars(
                select(model).where(
                    model.organization_id == organization.id,
                    model.is_archived.is_(False),
                )
            )
        ).all()
    )
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    columns = [
        column.name for column in model.__table__.columns if column.name != "organization_id"
    ]
    writer.writerow(columns)
    for row in rows:
        writer.writerow([getattr(row, column) for column in columns])
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={register_type}.csv"},
    )


@router.post("/attachments", response_model=AttachmentRead)
async def upload_attachment(
    session: SessionDep,
    identity: IdentityDep,
    organization: OrgDep,
    _: ManageDep,
    register_type: str = Form(...),
    record_id: str = Form(...),
    file: UploadFile = File(...),
) -> AttachmentRead:
    attachment = await FileService().upload(
        session,
        organization.id,
        identity.user_id,
        register_type,
        record_id,
        file.filename or "file",
        file.content_type or "application/octet-stream",
        await file.read(),
    )
    return AttachmentRead.model_validate(attachment)


@router.get("/attachments", response_model=list[AttachmentRead])
async def list_attachments(
    session: SessionDep,
    organization: OrgDep,
    _: ReadDep,
    register_type: str = Query(...),
    record_id: str = Query(...),
) -> list[AttachmentRead]:
    attachments = await FileService().list(
        session,
        organization.id,
        register_type,
        record_id,
    )
    return [AttachmentRead.model_validate(item) for item in attachments]
