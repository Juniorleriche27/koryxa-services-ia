from unittest.mock import AsyncMock

import pytest

from app.core.errors import ApplicationError
from app.core.identity import KoryxaIdentity
from app.core.permissions import (
    get_current_member,
    get_current_organization,
    require_permission,
)
from app.models.member import MemberRole, MemberStatus, OrganizationMember
from app.models.organization import Organization


@pytest.mark.asyncio
async def test_tenant_isolation_rejects_missing_tenant():
    identity = KoryxaIdentity(
        tenant_id="anonymous",
        user_id="user-123",
        email="test@koryxa.com",
        source=None,
        auth_provider=None,
        role=None,
        permissions=frozenset(),
    )
    session = AsyncMock()

    with pytest.raises(ApplicationError) as exc_info:
        await get_current_organization(identity, session)
    assert exc_info.value.code == "unauthorized_tenant"


@pytest.mark.asyncio
async def test_tenant_isolation_queries_strictly_by_tenant_id():
    identity = KoryxaIdentity(
        tenant_id="tenant-alpha",
        user_id="user-123",
        email="test@koryxa.com",
        source=None,
        auth_provider=None,
        role=None,
        permissions=frozenset(),
    )
    session = AsyncMock()
    session.scalar.return_value = None

    with pytest.raises(ApplicationError) as exc_info:
        await get_current_organization(identity, session)
    assert exc_info.value.code == "organization_not_found"


@pytest.mark.asyncio
async def test_non_member_cannot_access_organization():
    identity = KoryxaIdentity(
        tenant_id="tenant-alpha",
        user_id="user-intruder",
        email="intruder@koryxa.com",
        source=None,
        auth_provider=None,
        role=None,
        permissions=frozenset(),
    )
    org = Organization(
        id="org-123",
        tenant_id="tenant-alpha",
        name="Org Alpha",
        slug="org-alpha",
        created_by_user_id="user-legit-owner",
    )
    session = AsyncMock()
    session.scalar.side_effect = [org, None]

    with pytest.raises(ApplicationError) as exc_info:
        await get_current_member(identity, session)
    assert exc_info.value.code == "forbidden_member"


@pytest.mark.asyncio
async def test_creator_without_membership_is_not_auto_promoted():
    identity = KoryxaIdentity(
        tenant_id="tenant-alpha",
        user_id="user-creator",
        email="creator@koryxa.com",
        source=None,
        auth_provider=None,
        role=None,
        permissions=frozenset(),
    )
    org = Organization(
        id="org-123",
        tenant_id="tenant-alpha",
        name="Org Alpha",
        slug="org-alpha",
        created_by_user_id="user-creator",
    )
    session = AsyncMock()
    session.scalar.side_effect = [org, None]

    with pytest.raises(ApplicationError) as exc_info:
        await get_current_member(identity, session)

    assert exc_info.value.code == "forbidden_member"
    session.add.assert_not_called()
    session.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_contributor_cannot_perform_manage_action():
    identity = KoryxaIdentity(
        tenant_id="tenant-alpha",
        user_id="user-contrib",
        email="contrib@koryxa.com",
        source=None,
        auth_provider=None,
        role=None,
        permissions=frozenset(),
    )
    org = Organization(
        id="org-123",
        tenant_id="tenant-alpha",
        name="Org Alpha",
        slug="org-alpha",
        created_by_user_id="user-owner",
    )
    member = OrganizationMember(
        id="mem-1",
        organization_id="org-123",
        user_id="user-contrib",
        role=MemberRole.CONTRIBUTOR,
        status=MemberStatus.ACTIVE,
    )
    session = AsyncMock()
    session.scalar.side_effect = [org, member]

    dep = require_permission("organization:manage")
    with pytest.raises(ApplicationError) as exc_info:
        await dep(identity, session)
    assert exc_info.value.code == "permission_denied"


@pytest.mark.asyncio
async def test_owner_has_full_management_access():
    identity = KoryxaIdentity(
        tenant_id="tenant-alpha",
        user_id="user-owner",
        email="owner@koryxa.com",
        source=None,
        auth_provider=None,
        role=None,
        permissions=frozenset(),
    )
    org = Organization(
        id="org-123",
        tenant_id="tenant-alpha",
        name="Org Alpha",
        slug="org-alpha",
        created_by_user_id="user-owner",
    )
    member = OrganizationMember(
        id="mem-2",
        organization_id="org-123",
        user_id="user-owner",
        role=MemberRole.OWNER,
        status=MemberStatus.ACTIVE,
    )
    session = AsyncMock()
    session.scalar.side_effect = [org, member]

    dep = require_permission("organization:manage")
    res = await dep(identity, session)
    assert res.role == MemberRole.OWNER
