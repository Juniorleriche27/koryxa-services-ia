"""Authoritative operational dashboard summary shared by routes and Cora."""
from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Any

from sqlalchemy import and_, case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.attendance import AttendanceRecord
from app.models.registers import Offer, Procedure, Supplier
from app.services.financial_metrics import collect_financial_registers

async def fetch_summary(s: AsyncSession, org_id: str) -> dict[str, Any]:
    snapshot = await collect_financial_registers(s, org_id)
    financial_summary = snapshot.summary

    offers_agg = await s.execute(
        select(
            func.count(Offer.id).label("total"),
            func.coalesce(
                func.sum(case((Offer.track_stock.is_(True), Decimal("1")), else_=Decimal("0"))),
                Decimal("0"),
            ).label("active_products"),
            func.coalesce(
                func.sum(case(
                    (and_(Offer.track_stock.is_(True),
                          Offer.stock_quantity <= func.coalesce(Offer.min_stock_alert, Decimal("5"))),
                     Decimal("1")), else_=Decimal("0"),
                )),
                Decimal("0"),
            ).label("low_stock"),
            func.coalesce(
                func.sum(case(
                    (Offer.track_stock.is_(True),
                     func.coalesce(Offer.stock_quantity, Decimal("0"))
                     * func.coalesce(Offer.cost_price, func.coalesce(Offer.price, Decimal("0")))),
                    else_=Decimal("0"),
                )),
                Decimal("0"),
            ).label("stock_value"),
        ).where(Offer.organization_id == org_id, Offer.is_archived.is_(False))
    )
    orr = offers_agg.one()
    offers_count = int(orr.total or 0)
    active_products_count = int(orr.active_products or 0)
    low_stock_count = int(orr.low_stock or 0)
    total_stock_value = Decimal(str(orr.stock_value or 0))

    procedures_count = int(await s.scalar(
        select(func.count()).select_from(Procedure)
        .where(Procedure.organization_id == org_id, Procedure.is_archived.is_(False))
    ) or 0)
    suppliers_count = int(await s.scalar(
        select(func.count()).select_from(Supplier).where(Supplier.organization_id == org_id)
    ) or 0)
    present_today = int(await s.scalar(
        select(func.count()).select_from(AttendanceRecord).where(
            AttendanceRecord.organization_id == org_id,
            AttendanceRecord.date == date.today(),
            AttendanceRecord.status.in_(["present", "late"]),
        )
    ) or 0)

    return {
        **financial_summary,
        "offers_count": offers_count,
        "procedures_count": procedures_count,
        "suppliers_count": suppliers_count,
        "total_stock_value": total_stock_value,
        "low_stock_count": low_stock_count,
        "active_products_count": active_products_count,
        "present_employees_today_count": present_today,
    }

