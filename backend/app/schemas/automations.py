from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Any
from pydantic import BaseModel, Field


class LowStockItem(BaseModel):
    id: str
    name: str
    category: str | None = None
    stock_quantity: Decimal
    min_stock_alert: Decimal
    billing_unit: str | None = None
    is_out_of_stock: bool


class DailyDigestSalesSummary(BaseModel):
    total_amount: Decimal = Decimal("0")
    sales_count: int = 0
    currency: str = "XOF"
    by_payment_method: dict[str, Decimal] = Field(default_factory=dict)


class DailyDigestExpensesSummary(BaseModel):
    total_amount: Decimal = Decimal("0")
    expenses_count: int = 0
    currency: str = "XOF"
    by_category: dict[str, Decimal] = Field(default_factory=dict)


class DailyDigestAttendanceSummary(BaseModel):
    total_present: int = 0
    total_late: int = 0
    total_checked_out: int = 0


class DailyDigestResponse(BaseModel):
    date: date
    organization_id: str
    organization_name: str
    currency: str = "XOF"
    sales: DailyDigestSalesSummary
    expenses: DailyDigestExpensesSummary
    net_cashflow: Decimal = Decimal("0")
    low_stock_alerts: list[LowStockItem] = Field(default_factory=list)
    attendance: DailyDigestAttendanceSummary
    formatted_message: str


class UnpaidReminderItem(BaseModel):
    sale_id: str
    reference: str
    sale_date: date
    client_name: str
    item_label: str
    total_amount: Decimal
    currency: str
    days_overdue: int
    suggested_message: str


class UnpaidRemindersResponse(BaseModel):
    date: date
    organization_id: str
    total_unpaid_count: int
    total_unpaid_amount: Decimal
    currency: str = "XOF"
    reminders: list[UnpaidReminderItem] = Field(default_factory=list)


class SendAutomationResult(BaseModel):
    success: bool
    channel: str
    sent_count: int
    message: str
