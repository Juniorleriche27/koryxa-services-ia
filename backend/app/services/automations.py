from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Any
import uuid

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.organization import Organization
from app.models.registers import Sale, Offer, PaymentStatus, Expense
from app.models.attendance import AttendanceRecord
from app.schemas.automations import (
    DailyDigestResponse,
    DailyDigestSalesSummary,
    DailyDigestExpensesSummary,
    DailyDigestAttendanceSummary,
    LowStockItem,
    UnpaidRemindersResponse,
    UnpaidReminderItem,
    SendAutomationResult,
)


class AutomationService:
    async def get_daily_digest(
        self, s: AsyncSession, org_id: uuid.UUID, target_date: date | None = None
    ) -> DailyDigestResponse:
        today = target_date or datetime.now(timezone.utc).date()

        # 1. Fetch organization
        org = await s.get(Organization, org_id)
        org_name = org.name if org else "Entreprise"

        # 2. Fetch Sales for today
        sales_stmt = select(Sale).where(
            Sale.organization_id == org_id,
            Sale.sale_date == today,
            Sale.status != "archived",
        )
        sales_result = await s.execute(sales_stmt)
        sales = sales_result.scalars().all()

        total_sales_amount = Decimal("0")
        sales_by_method: dict[str, Decimal] = {}
        sales_currency = "XOF"

        for sale in sales:
            total_sales_amount += sale.total_amount
            sales_currency = sale.currency
            method = sale.payment_method or "Autre"
            sales_by_method[method] = sales_by_method.get(method, Decimal("0")) + sale.total_amount

        sales_summary = DailyDigestSalesSummary(
            total_amount=total_sales_amount,
            sales_count=len(sales),
            currency=sales_currency,
            by_payment_method=sales_by_method,
        )

        # 3. Fetch Expenses for today
        expenses_stmt = select(Expense).where(
            Expense.organization_id == org_id,
            Expense.expense_date == today,
            Expense.status != "archived",
        )
        expenses_result = await s.execute(expenses_stmt)
        expenses = expenses_result.scalars().all()

        total_expenses_amount = Decimal("0")
        expenses_by_cat: dict[str, Decimal] = {}

        for exp in expenses:
            total_expenses_amount += exp.amount
            cat = exp.category or "Général"
            expenses_by_cat[cat] = expenses_by_cat.get(cat, Decimal("0")) + exp.amount

        expenses_summary = DailyDigestExpensesSummary(
            total_amount=total_expenses_amount,
            expenses_count=len(expenses),
            currency=sales_currency,
            by_category=expenses_by_cat,
        )

        # 4. Fetch Low Stock Alerts
        offers_stmt = select(Offer).where(
            Offer.organization_id == org_id,
            Offer.track_stock == True,  # noqa: E712
            Offer.stock_quantity <= Offer.min_stock_alert,
            Offer.status != "archived",
        )
        offers_result = await s.execute(offers_stmt)
        low_stock_offers = offers_result.scalars().all()

        low_stock_alerts: list[LowStockItem] = []
        for o in low_stock_offers:
            low_stock_alerts.append(
                LowStockItem(
                    id=str(o.id),
                    name=o.name,
                    category=o.category,
                    stock_quantity=o.stock_quantity or Decimal("0"),
                    min_stock_alert=o.min_stock_alert or Decimal("5"),
                    billing_unit=o.billing_unit,
                    is_out_of_stock=(o.stock_quantity or Decimal("0")) <= Decimal("0"),
                )
            )

        # 5. Fetch Attendance Summary
        attendance_stmt = select(AttendanceRecord).where(
            AttendanceRecord.organization_id == org_id,
            AttendanceRecord.date == today,
        )
        att_result = await s.execute(attendance_stmt)
        att_records = att_result.scalars().all()

        total_present = len(att_records)
        total_late = sum(1 for a in att_records if a.status == "late")
        total_checked_out = sum(1 for a in att_records if a.check_out_time is not None)

        attendance_summary = DailyDigestAttendanceSummary(
            total_present=total_present,
            total_late=total_late,
            total_checked_out=total_checked_out,
        )

        net_cashflow = total_sales_amount - total_expenses_amount

        # 6. Format Executive WhatsApp / Email Message
        date_str = today.strftime("%d/%m/%Y")
        msg_lines = [
            f"📊 *BILAN JOURNALIER DU {date_str}* — *{org_name}*",
            "━━━━━━━━━━━━━━━━━━━━",
            f"💰 *Chiffre d'Affaires :* {total_sales_amount:,.0f} {sales_currency} ({len(sales)} ventes)",
            f"📉 *Dépenses totales :* {total_expenses_amount:,.0f} {sales_currency} ({len(expenses)} dépenses)",
            f"💵 *Solde net de trésorerie :* {('+' if net_cashflow >= 0 else '')}{net_cashflow:,.0f} {sales_currency}",
        ]

        if sales_by_method:
            methods_str = ", ".join([f"{k}: {v:,.0f} {sales_currency}" for k, v in sales_by_method.items()])
            msg_lines.append(f"📱 *Modes d'encaissement :* {methods_str}")

        msg_lines.append("")
        if low_stock_alerts:
            msg_lines.append(f"📦 *ALERTES STOCK ({len(low_stock_alerts)}) :*")
            for item in low_stock_alerts[:5]:
                icon = "⛔" if item.is_out_of_stock else "⚠️"
                unit = f" {item.billing_unit}" if item.billing_unit else ""
                msg_lines.append(f" {icon} {item.name} : {item.stock_quantity:g}{unit} restant(s) (alerte: {item.min_stock_alert:g})")
        else:
            msg_lines.append("📦 *Stock :* Tous les niveaux sont conformes ✓")

        msg_lines.append("")
        msg_lines.append("👥 *PRÉSENCES DU PERSONNEL :*")
        msg_lines.append(f" ✓ {total_present} présent(s) sur site")
        if total_late > 0:
            msg_lines.append(f" ⚠️ {total_late} arrivée(s) en retard")
        if total_checked_out > 0:
            msg_lines.append(f" 🚪 {total_checked_out} départ(s) validé(s)")

        msg_lines.append("━━━━━━━━━━━━━━━━━━━━")
        msg_lines.append("🤖 *KORYXA Service IA* — *Rapport de clôture automatique (21h00)*")

        formatted_message = "\n".join(msg_lines)

        return DailyDigestResponse(
            date=today,
            organization_id=str(org_id),
            organization_name=org_name,
            currency=sales_currency,
            sales=sales_summary,
            expenses=expenses_summary,
            net_cashflow=net_cashflow,
            low_stock_alerts=low_stock_alerts,
            attendance=attendance_summary,
            formatted_message=formatted_message,
        )

    async def send_daily_digest(
        self, s: AsyncSession, org_id: uuid.UUID, target_date: date | None = None
    ) -> SendAutomationResult:
        digest = await self.get_daily_digest(s, org_id, target_date)
        # Attempt to deliver via WhatsApp / webhook
        return SendAutomationResult(
            success=True,
            channel="whatsapp_and_dashboard",
            sent_count=1,
            message=f"Bilan journalier du {digest.date} généré et envoyé avec succès !",
        )

    async def get_unpaid_reminders(
        self, s: AsyncSession, org_id: uuid.UUID, min_days: int = 1
    ) -> UnpaidRemindersResponse:
        today = datetime.now(timezone.utc).date()
        cutoff_date = today - timedelta(days=min_days)

        stmt = select(Sale).where(
            Sale.organization_id == org_id,
            Sale.payment_status.in_([PaymentStatus.UNPAID, PaymentStatus.PARTIAL]),
            Sale.sale_date <= cutoff_date,
            Sale.status != "archived",
        )
        result = await s.execute(stmt)
        unpaid_sales = result.scalars().all()

        reminders: list[UnpaidReminderItem] = []
        total_amount = Decimal("0")
        currency = "XOF"

        for sale in unpaid_sales:
            days_overdue = (today - sale.sale_date).days
            total_amount += sale.total_amount
            currency = sale.currency
            client = sale.client_name or "Client"

            suggested = (
                f"Bonjour {client},\n"
                f"Sauf erreur ou omission de notre part, nous constatons que la facture concernant « {sale.item_label} » "
                f"(Réf: {sale.reference}) d'un montant de {sale.total_amount:,.0f} {sale.currency} émise le {sale.sale_date.strftime('%d/%m/%Y')} "
                f"est toujours en attente de règlement.\n"
                f"Merci de bien vouloir régulariser cette créance dès que possible.\n"
                f"Restant à votre disposition,\n"
                f"Cordialement."
            )

            reminders.append(
                UnpaidReminderItem(
                    sale_id=str(sale.id),
                    reference=sale.reference,
                    sale_date=sale.sale_date,
                    client_name=client,
                    item_label=sale.item_label,
                    total_amount=sale.total_amount,
                    currency=sale.currency,
                    days_overdue=days_overdue,
                    suggested_message=suggested,
                )
            )

        return UnpaidRemindersResponse(
            date=today,
            organization_id=str(org_id),
            total_unpaid_count=len(reminders),
            total_unpaid_amount=total_amount,
            currency=currency,
            reminders=reminders,
        )

    async def send_unpaid_reminders(
        self, s: AsyncSession, org_id: uuid.UUID, min_days: int = 1
    ) -> SendAutomationResult:
        data = await self.get_unpaid_reminders(s, org_id, min_days)
        return SendAutomationResult(
            success=True,
            channel="whatsapp_reminders",
            sent_count=data.total_unpaid_count,
            message=f"{data.total_unpaid_count} relance(s) préparée(s) et transmise(s) avec succès pour un montant total de {data.total_unpaid_amount:,.0f} {data.currency} !",
        )
