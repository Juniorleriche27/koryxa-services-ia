from __future__ import annotations

from datetime import datetime
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.registers import DocumentType, Expense, ExpenseDocumentType, Sale


async def generate_next_sale_reference(
    s: AsyncSession,
    org_id: str,
    doc_type: DocumentType | str = DocumentType.INVOICE,
    year: int | None = None,
) -> str:
    """Generate a clean, professional sequential reference like FAC-2026-001, DEV-2026-001, REC-2026-001."""
    current_year = year or datetime.now().year
    type_str = doc_type.value if hasattr(doc_type, "value") else str(doc_type).lower()

    prefix_map = {
        "quote": "DEV",
        "proforma": "PRO",
        "invoice": "FAC",
        "receipt": "REC",
    }
    prefix = prefix_map.get(type_str, "FAC")
    search_pattern = f"{prefix}-{current_year}-%"

    # Count existing sales with matching prefix for this organization and year
    count_query = (
        select(func.count())
        .select_from(Sale)
        .where(
            Sale.organization_id == org_id,
            Sale.reference.like(search_pattern),
        )
    )
    current_count = (await s.scalar(count_query)) or 0
    next_number = current_count + 1

    return f"{prefix}-{current_year}-{next_number:03d}"


async def generate_next_expense_reference(
    s: AsyncSession,
    org_id: str,
    doc_type: ExpenseDocumentType | str = ExpenseDocumentType.EXPENSE_RECEIPT,
    year: int | None = None,
) -> str:
    """Generate a clean sequential reference for expenses like DEP-2026-001, FAC-FOURN-2026-001."""
    current_year = year or datetime.now().year
    type_str = doc_type.value if hasattr(doc_type, "value") else str(doc_type).lower()

    prefix_map = {
        "expense_receipt": "DEP",
        "supplier_invoice": "FACF",
        "voucher": "BDC",
    }
    prefix = prefix_map.get(type_str, "DEP")
    search_pattern = f"{prefix}-{current_year}-%"

    count_query = (
        select(func.count())
        .select_from(Expense)
        .where(
            Expense.organization_id == org_id,
            Expense.reference.like(search_pattern),
        )
    )
    current_count = (await s.scalar(count_query)) or 0
    next_number = current_count + 1

    return f"{prefix}-{current_year}-{next_number:03d}"
