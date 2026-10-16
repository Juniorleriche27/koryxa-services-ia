"""Grand Hall v1 : synthèse institutionnelle par entreprise active."""
from typing import Annotated, Any
from time import perf_counter
import logging

from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import get_current_organization, require_permission
from app.db.session import get_session
from app.models.organization import Organization
from app.services.grand_hall import fetch_grand_hall
from app.services.phase7_governance import organization_hall_profile

router = APIRouter()
logger = logging.getLogger(__name__)
SLOW_HALL_THRESHOLD_MS = 1000


@router.get("")
async def get_grand_hall(
    response: Response,
    session: Annotated[AsyncSession, Depends(get_session)],
    organization: Annotated[Organization, Depends(get_current_organization)],
    _: Annotated[object, Depends(require_permission("registers:read"))],
) -> dict[str, Any]:
    """Lecture seule, filtrage tenant garanti par les services et les permissions."""
    started = perf_counter()
    response.headers["Cache-Control"] = "private, no-store"
    response.headers["X-Analytics-Schema"] = "1.0"
    try:
        payload = await fetch_grand_hall(session, str(organization.id))
        payload["organization_profile"] = organization_hall_profile(organization)
        return payload
    finally:
        duration_ms = (perf_counter() - started) * 1000
        response.headers["Server-Timing"] = f"grand_hall;dur={duration_ms:.1f}"
        # Intentionally no IDs, business figures, or personal information in logs.
        if duration_ms >= SLOW_HALL_THRESHOLD_MS:
            logger.warning("grand_hall_slow duration_ms=%.1f", duration_ms)
