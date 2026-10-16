"""Catalogue départemental institutionnel par organisation active."""
from typing import Annotated, Any
from fastapi import APIRouter, Depends
from app.core.permissions import get_current_organization, get_current_member
from app.models.organization import Organization
from app.models.member import OrganizationMember
from app.services.departments import department_catalogue

router = APIRouter()


@router.get("")
async def list_departments(
    organization: Annotated[Organization, Depends(get_current_organization)],
    member: Annotated[OrganizationMember, Depends(get_current_member)],
) -> dict[str, Any]:
    return department_catalogue(organization.id, member.role)
