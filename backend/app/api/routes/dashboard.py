# mypy: disable-error-code="no-untyped-def,no-untyped-call"
# ruff: noqa: B008
from __future__ import annotations

import asyncio
from datetime import date
from decimal import Decimal
from typing import Annotated, Any

from fastapi import APIRouter, Depends
from sqlalchemy import and_, case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import get_current_member, get_current_organization
from app.db.session import get_session
from app.models.attendance import AttendanceRecord
from app.models.member import OrganizationMember
from app.models.organization import Organization
from app.models.radar import AlertStatus, RadarAlert
from app.models.registers import (
    Expense,
    Offer,
    Procedure,
    Sale,
    Supplier,
)
from app.models.workflow import ActionStatus, CorrectiveAction

router = APIRouter()
SessionDep = Annotated[AsyncSession, Depends(get_session)]
OrgDep = Annotated[Organization, Depends(get_current_organization)]
MemberDep = Annotated[OrganizationMember, Depends(get_current_member)]


async def _fetch_summary(s: AsyncSession, org_id: str) -> dict[str, Any]:
    sales_agg = await s.execute(
        select(
            func.count(Sale.id).label("total_count"),
            func.coalesce(func.sum(Sale.total_amount), Decimal("0")).label("total_amount"),
            func.coalesce(
                func.sum(
                    case(
                        (Sale.payment_status == "paid",
                         func.coalesce(func.nullif(Sale.paid_amount, Decimal("0")), Sale.total_amount)),
                        (Sale.payment_status == "partial",
                         func.coalesce(Sale.paid_amount, Decimal("0"))),
                        else_=Decimal("0"),
                    )
                ),
                Decimal("0"),
            ).label("total_paid"),
            func.coalesce(
                func.sum(
                    case(
                        (Sale.payment_status == "partial",
                         func.greatest(Decimal("0"), Sale.total_amount - func.coalesce(Sale.paid_amount, Decimal("0")))),
                        else_=Decimal("0"),
                    )
                ),
                Decimal("0"),
            ).label("total_partial"),
            func.max(Sale.currency).label("primary_currency"),
        ).where(Sale.organization_id == org_id, Sale.is_archived.is_(False))
    )
    sr = sales_agg.one()
    total_sales_count = int(sr.total_count or 0)
    total_sales_amount = Decimal(str(sr.total_amount or 0))
    total_paid_amount = Decimal(str(sr.total_paid or 0))
    total_partial_amount = Decimal(str(sr.total_partial or 0))
    total_unpaid_amount = max(Decimal("0"), total_sales_amount - total_paid_amount)
    primary_currency = sr.primary_currency or "XOF"

    recent_sales_rows = list(
        (await s.scalars(
            select(Sale)
            .where(Sale.organization_id == org_id, Sale.is_archived.is_(False))
            .order_by(Sale.sale_date.desc())
            .limit(10)
        )).all()
    )

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

    expenses_agg = await s.execute(
        select(
            func.count(Expense.id).label("total"),
            func.coalesce(
                func.sum(case((Expense.payment_status == "paid", Expense.amount), else_=Decimal("0"))),
                Decimal("0"),
            ).label("paid"),
            func.coalesce(
                func.sum(case((Expense.payment_status != "paid", Expense.amount), else_=Decimal("0"))),
                Decimal("0"),
            ).label("unpaid"),
        ).where(Expense.organization_id == org_id, Expense.is_archived.is_(False))
    )
    er = expenses_agg.one()
    expenses_count = int(er.total or 0)
    total_expenses_paid = Decimal(str(er.paid or 0))
    total_expenses_unpaid = Decimal(str(er.unpaid or 0))

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
        "total_sales_count": total_sales_count,
        "total_sales_amount": total_sales_amount,
        "total_paid_amount": total_paid_amount,
        "total_unpaid_amount": total_unpaid_amount,
        "total_partial_amount": total_partial_amount,
        "offers_count": offers_count,
        "procedures_count": procedures_count,
        "expenses_count": expenses_count,
        "suppliers_count": suppliers_count,
        "total_expenses_paid": total_expenses_paid,
        "total_expenses_unpaid": total_expenses_unpaid,
        "net_cash_position": total_paid_amount - total_expenses_paid,
        "total_stock_value": total_stock_value,
        "low_stock_count": low_stock_count,
        "active_products_count": active_products_count,
        "present_employees_today_count": present_today,
        "primary_currency": primary_currency,
        "recent_sales": recent_sales_rows,
    }


async def _fetch_alerts(s: AsyncSession, org_id: str) -> list[Any]:
    return list((await s.scalars(
        select(RadarAlert)
        .where(RadarAlert.organization_id == org_id, RadarAlert.status == AlertStatus.OPEN)
        .order_by(RadarAlert.created_at.desc())
        .limit(20)
    )).all())


async def _fetch_actions(s: AsyncSession, org_id: str) -> list[Any]:
    return list((await s.scalars(
        select(CorrectiveAction)
        .where(
            CorrectiveAction.organization_id == org_id,
            CorrectiveAction.status.in_([ActionStatus.TODO, ActionStatus.IN_PROGRESS]),
        )
        .order_by(CorrectiveAction.created_at.desc())
        .limit(20)
    )).all())


@router.get("")
async def get_dashboard(s: SessionDep, organization: OrgDep, _: MemberDep) -> dict[str, Any]:
    """Single aggregated dashboard endpoint using asyncio.gather() for parallelism."""
    org_id = str(organization.id)
    summary, alerts, actions = await asyncio.gather(
        _fetch_summary(s, org_id),
        _fetch_alerts(s, org_id),
        _fetch_actions(s, org_id),
    )
    return {"organization": organization, "summary": summary, "alerts": alerts, "actions": actions}
