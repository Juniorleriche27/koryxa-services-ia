from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, File, Form, Request, UploadFile
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.identity import KoryxaIdentity, require_koryxa_identity
from app.core.permissions import get_current_organization, require_permission
from app.db.session import get_session
from app.models.member import OrganizationMember
from app.models.organization import Organization
from app.schemas.imports import AttachmentRead, ImportPreview
from app.services.direct_uploads import DirectUploadTokenService
from app.services.files import FileService
from app.services.imports import ImportService

router = APIRouter()
SessionDep = Annotated[AsyncSession, Depends(get_session)]
IdentityDep = Annotated[KoryxaIdentity, Depends(require_koryxa_identity)]
OrgDep = Annotated[Organization, Depends(get_current_organization)]
ManageDep = Annotated[OrganizationMember, Depends(require_permission("registers:manage"))]


class UploadAuthorization(BaseModel):
    kind: Literal["import", "attachment"]
    register_type: str
    record_id: str | None = None


class UploadAuthorizationRead(BaseModel):
    upload_url: str
    token: str
    expires_at: datetime


@router.post("/authorize", response_model=UploadAuthorizationRead)
async def authorize_upload(
    data: UploadAuthorization,
    request: Request,
    identity: IdentityDep,
    organization: OrgDep,
    _: ManageDep,
) -> UploadAuthorizationRead:
    claims = {
        "kind": data.kind,
        "organization_id": organization.id,
        "user_id": identity.user_id,
        "register_type": data.register_type,
        "record_id": data.record_id or "",
    }
    token, expires_at = DirectUploadTokenService().create(claims)
    route_name = "direct_import_upload" if data.kind == "import" else "direct_attachment_upload"
    upload_url = str(request.url_for(route_name))
    if get_settings().environment == "production" and upload_url.startswith("http://"):
        upload_url = f"https://{upload_url.removeprefix('http://')}"
    return UploadAuthorizationRead(
        upload_url=upload_url,
        token=token,
        expires_at=datetime.fromtimestamp(expires_at, UTC),
    )


@router.post("/import", response_model=ImportPreview, name="direct_import_upload")
async def direct_import_upload(
    session: SessionDep,
    token: str = Form(...),
    file: UploadFile = File(...),
) -> ImportPreview:
    claims = DirectUploadTokenService().verify(token, "import")
    content = await file.read(get_settings().max_upload_bytes + 1)
    if len(content) > get_settings().max_upload_bytes:
        from app.core.errors import ApplicationError

        raise ApplicationError("file_too_large", "Le fichier dépasse la limite de 100 Mo", 413)
    job, headers, mapping = await ImportService().preview(
        session,
        claims["organization_id"],
        claims["user_id"],
        claims["register_type"],
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


@router.post("/attachment", response_model=AttachmentRead, name="direct_attachment_upload")
async def direct_attachment_upload(
    session: SessionDep,
    token: str = Form(...),
    file: UploadFile = File(...),
) -> AttachmentRead:
    claims = DirectUploadTokenService().verify(token, "attachment")
    attachment = await FileService().upload(
        session,
        claims["organization_id"],
        claims["user_id"],
        claims["register_type"],
        claims["record_id"],
        file.filename or "document",
        file.content_type or "application/octet-stream",
        await file.read(get_settings().max_upload_bytes + 1),
    )
    return AttachmentRead.model_validate(attachment)
