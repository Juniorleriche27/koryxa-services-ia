# mypy: disable-error-code="no-untyped-def,no-untyped-call"
# ruff: noqa: B008
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.identity import KoryxaIdentity, require_koryxa_identity
from app.core.permissions import get_current_organization, require_permission
from app.db.session import get_session
from app.models.member import OrganizationMember
from app.models.organization import Organization
from app.models.workflow import ActionStatus, ValidationStatus
from app.schemas.workflow import (
    ActionCreate,
    ActionRead,
    ActionUpdate,
    AuditEventRead,
    CommentCreate,
    CommentRead,
    ValidationCreate,
    ValidationDecision,
    ValidationRead,
)
from app.services.workflow import WorkflowService

router = APIRouter()
SessionDep = Annotated[AsyncSession, Depends(get_session)]
IdentityDep = Annotated[KoryxaIdentity, Depends(require_koryxa_identity)]
OrgDep = Annotated[Organization, Depends(get_current_organization)]
ReadDep = Annotated[OrganizationMember, Depends(require_permission("registers:read"))]
ManageDep = Annotated[OrganizationMember, Depends(require_permission("registers:manage"))]
service = WorkflowService()


@router.post("/validations", response_model=ValidationRead, status_code=201)
async def create_validation(
    data: ValidationCreate,
    session: SessionDep,
    identity: IdentityDep,
    organization: OrgDep,
    _: ManageDep,
):
    return await service.create_validation(session, organization.id, identity.user_id, data)


@router.get("/validations", response_model=list[ValidationRead])
async def list_validations(
    session: SessionDep,
    organization: OrgDep,
    _: ReadDep,
    status: ValidationStatus | None = None,
):
    return await service.list_validations(session, organization.id, status)


@router.post("/validations/{validation_id}/decision", response_model=ValidationRead)
async def decide_validation(
    validation_id: str,
    data: ValidationDecision,
    session: SessionDep,
    identity: IdentityDep,
    organization: OrgDep,
    _: ManageDep,
):
    return await service.decide_validation(
        session,
        organization.id,
        identity.user_id,
        validation_id,
        data,
    )


@router.post("/actions", response_model=ActionRead, status_code=201)
async def create_action(
    data: ActionCreate,
    session: SessionDep,
    identity: IdentityDep,
    organization: OrgDep,
    _: ManageDep,
):
    return await service.create_action(session, organization.id, identity.user_id, data)


@router.get("/actions", response_model=list[ActionRead])
async def list_actions(
    session: SessionDep,
    organization: OrgDep,
    _: ReadDep,
    status: ActionStatus | None = None,
    responsible_user_id: str | None = None,
):
    return await service.list_actions(
        session,
        organization.id,
        status,
        responsible_user_id,
    )


@router.patch("/actions/{action_id}", response_model=ActionRead)
async def update_action(
    action_id: str,
    data: ActionUpdate,
    session: SessionDep,
    identity: IdentityDep,
    organization: OrgDep,
    _: ManageDep,
):
    return await service.update_action(
        session,
        organization.id,
        identity.user_id,
        action_id,
        data,
    )


@router.post("/actions/{action_id}/comments", response_model=CommentRead, status_code=201)
async def add_comment(
    action_id: str,
    data: CommentCreate,
    session: SessionDep,
    identity: IdentityDep,
    organization: OrgDep,
    _: ManageDep,
):
    return await service.add_comment(
        session,
        organization.id,
        identity.user_id,
        action_id,
        data.body,
    )


@router.get("/actions/{action_id}/comments", response_model=list[CommentRead])
async def list_comments(
    action_id: str,
    session: SessionDep,
    organization: OrgDep,
    _: ReadDep,
):
    return await service.list_comments(session, organization.id, action_id)


@router.get("/audit", response_model=list[AuditEventRead])
async def audit_events(
    session: SessionDep,
    organization: OrgDep,
    _: ReadDep,
    entity_type: str | None = None,
    entity_id: str | None = None,
):
    return await service.audit_events(
        session,
        organization.id,
        entity_type,
        entity_id,
    )
