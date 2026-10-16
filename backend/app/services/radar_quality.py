"""Projection Radar canonique commune au dashboard, Grand Hall et API Radar."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.radar import AlertStatus, RadarAlert, RadarRuleConfig, RadarRun
from app.services.radar import DEFAULTS
from app.services.radar_scoring import radar_quality_score


async def radar_quality_snapshot(session: AsyncSession, organization_id: str) -> dict:
    last_run = await session.scalar(
        select(RadarRun).where(
            RadarRun.organization_id == organization_id,
        ).order_by(RadarRun.created_at.desc()).limit(1)
    )
    configs = (await session.scalars(select(RadarRuleConfig).where(
        RadarRuleConfig.organization_id == organization_id
    ))).all()
    disabled = {c.rule_code for c in configs if not c.enabled}
    dimensions = (await session.execute(select(RadarAlert.rule_code, RadarAlert.dimension).where(
        RadarAlert.organization_id == organization_id,
        RadarAlert.status.in_([AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED]),
    ))).all()
    active_dimensions = [dimension for code, dimension in dimensions if code not in disabled]
    score = radar_quality_score(active_dimensions, audited=last_run is not None)
    score["last_audit_at"] = last_run.created_at.isoformat() if last_run and last_run.created_at else None
    score["rules_total"] = len(DEFAULTS)
    score["rules_enabled"] = len(DEFAULTS) - len(disabled)
    score["rule_coverage_ratio"] = round((len(DEFAULTS) - len(disabled)) / len(DEFAULTS), 4)
    score["active_alerts_excluded_due_to_disabled_rules"] = len(dimensions) - len(active_dimensions)
    score["freshness_status"] = "never_audited" if last_run is None else "last_execution_available"
    # A zero-alert score is not proof that all underlying data were inspected.
    score["quality_certified"] = False
    return score
