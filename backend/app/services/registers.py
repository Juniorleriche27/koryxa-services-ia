from datetime import UTC, date, datetime
from uuid import uuid4
from decimal import Decimal

from sqlalchemy import delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ApplicationError
from app.models.organization import Organization
from app.models.registers import (
    RecordStatus,
    DocumentType,
    Expense,
    ExpenseDocumentType,
    Offer,
    PaymentStatus,
    Procedure,
    ProcedureStep,
    RecordHistory,
    Sale,
    Supplier,
)
from app.schemas.registers import (
    PublicDocumentPayRequest,
    PublicDocumentPaymentResponse,
    PublicDocumentRead,
    PublicDocumentSignRequest,
    ConvertDocumentRequest,
    ExpenseCreate,
    ExpenseUpdate,
    OfferCreate,
    OfferUpdate,
    ProcedureCreate,
    ProcedureUpdate,
    RecordPaymentRequest,
    SaleCreate,
    SaleUpdate,
    StockAdjustmentRequest,
    SupplierCreate,
    SupplierUpdate,
)
from app.services.financial_audit import add_financial_audit
from app.services.reference_generator import (
    generate_next_expense_reference,
    generate_next_sale_reference,
)


def serialize_val(v: object) -> object:
    if isinstance(v, date | Decimal):
        return str(v)
    return v


def diff(before: dict[str, object], after: dict[str, object]) -> dict[str, object]:
    return {
        k: {"before": serialize_val(before.get(k)), "after": serialize_val(v)}
        for k, v in after.items()
        if before.get(k) != v
    }


class RegisterService:
    async def _history(
        self,
        s: AsyncSession,
        org: str,
        typ: str,
        rid: str,
        action: str,
        user: str,
        changes: dict[str, object],
    ):
        s.add(
            RecordHistory(
                organization_id=org,
                record_type=typ,
                record_id=rid,
                action=action,
                actor_user_id=user,
                changes=changes,
            )
        )
        if typ in {"sale", "expenses", "expense"}:
            add_financial_audit(
                s,
                organization_id=org,
                entity_type="sale" if typ == "sale" else "expense",
                entity_id=rid,
                event_type=action,
                actor_user_id=user,
                payload=changes,
            )

    async def create_offer(self, s, org, user, data: OfferCreate):
        obj = Offer(
            organization_id=org,
            created_by_user_id=user,
            updated_by_user_id=user,
            **data.model_dump(),
        )
        s.add(obj)
        await s.flush()
        await self._history(s, org, "offer", obj.id, "created", user, data.model_dump(mode="json"))
        await s.commit()
        await s.refresh(obj)
        return obj

    async def list_offers(self, s, org, q, status, category, page, size):
        stmt = select(Offer).where(Offer.organization_id == org, Offer.is_archived.is_(False))
        count = (
            select(func.count())
            .select_from(Offer)
            .where(Offer.organization_id == org, Offer.is_archived.is_(False))
        )
        for cond in ([Offer.status == status] if status else []) + (
            [Offer.category == category] if category else []
        ):
            stmt = stmt.where(cond)
            count = count.where(cond)
        if q:
            cond = or_(Offer.name.ilike(f"%{q}%"), Offer.description.ilike(f"%{q}%"))
            stmt = stmt.where(cond)
            count = count.where(cond)
        return list(
            (
                await s.scalars(
                    stmt.order_by(Offer.created_at.desc()).offset((page - 1) * size).limit(size)
                )
            ).all()
        ), int(await s.scalar(count) or 0)

    async def get_offer(self, s, org, rid):
        obj = await s.scalar(select(Offer).where(Offer.id == rid, Offer.organization_id == org))
        if not obj:
            raise ApplicationError("offer_not_found", "Offre introuvable", 404)
        return obj

    async def update_offer(self, s, org, user, rid, data: OfferUpdate):
        obj = await self.get_offer(s, org, rid)
        before = {k: getattr(obj, k) for k in data.model_fields_set}
        values = data.model_dump(exclude_unset=True)
        for k, v in values.items():
            setattr(obj, k, v)
        obj.updated_by_user_id = user
        await self._history(s, org, "offer", rid, "updated", user, diff(before, values))
        await s.commit()
        await s.refresh(obj)
        return obj

    async def create_sale(self, s, org, user, data: SaleCreate):
        target_offer = None
        if data.offer_id:
            target_offer = await self.get_offer(s, org, data.offer_id)
        elif data.item_label:
            target_offer = await s.scalar(
                select(Offer).where(
                    Offer.organization_id == org,
                    Offer.name.ilike(data.item_label.strip()),
                    Offer.is_archived.is_(False),
                )
            )

        values = data.model_dump()
        if target_offer and not values.get("offer_id"):
            values["offer_id"] = target_offer.id

        total_amount = (
            data.total_amount
            if data.total_amount is not None
            else max(Decimal("0"), data.quantity * data.unit_price - data.discount)
        )
        values["total_amount"] = total_amount

        # Automatic Reference Generation if empty or default
        doc_type = data.document_type or DocumentType.INVOICE
        values["document_type"] = doc_type
        ref = (values.get("reference") or "").strip()
        if not ref or ref.lower() in ("auto", "nouveau", "new", "ref", "string", "null"):
            ref = await generate_next_sale_reference(s, org, doc_type)
        values["reference"] = ref

        # Calculate paid_amount and deposit
        paid_amount = values.get("paid_amount") or Decimal("0.00")
        if values.get("deposit_percentage") is not None and paid_amount == Decimal("0.00"):
            deposit_pct = Decimal(str(values["deposit_percentage"]))
            paid_amount = max(Decimal("0.00"), (total_amount * deposit_pct) / Decimal("100"))

        # Cap paid_amount to total_amount
        paid_amount = min(total_amount, max(Decimal("0.00"), paid_amount)) if total_amount > 0 else Decimal("0.00")

        if (
            values.get("payment_status") == PaymentStatus.PAID
            and paid_amount == Decimal("0.00")
            and total_amount > 0
        ):
            paid_amount = total_amount

        if paid_amount >= total_amount and total_amount > 0:
            values["payment_status"] = PaymentStatus.PAID
            paid_amount = total_amount
        elif paid_amount > Decimal("0.00"):
            values["payment_status"] = PaymentStatus.PARTIAL
        else:
            values["payment_status"] = PaymentStatus.UNPAID

        values["paid_amount"] = paid_amount

        # Initial payment history if paid
        history = list(values.get("payment_history") or [])
        if paid_amount > Decimal("0.00") and not history:
            history.append(
                {
                    "date": str(data.sale_date),
                    "amount": str(paid_amount),
                    "method": data.payment_method or "Espèces",
                    "comment": "Paiement / Acompte initial",
                    "recorded_by": user,
                    "resulting_balance": str(max(Decimal("0.00"), total_amount - paid_amount)),
                }
            )
        values["payment_history"] = history

        obj = Sale(organization_id=org, created_by_user_id=user, updated_by_user_id=user, **values)
        s.add(obj)
        await s.flush()

        # Automatic Stock Decrement if product tracks inventory
        if target_offer and target_offer.track_stock:
            current_qty = (
                target_offer.stock_quantity
                if target_offer.stock_quantity is not None
                else Decimal("0.00")
            )
            sold_qty = data.quantity if data.quantity is not None else Decimal("1.00")
            target_offer.stock_quantity = max(Decimal("0.00"), current_qty - sold_qty)
            target_offer.updated_by_user_id = user

        await self._history(
            s, org, "sale", obj.id, "created", user, {k: str(v) for k, v in values.items()}
        )
        await s.commit()
        await s.refresh(obj)
        return obj

    async def record_sale_payment(
        self, s: AsyncSession, org: str, user: str, rid: str, data: RecordPaymentRequest
    ) -> Sale:
        obj = await self.get_sale(s, org, rid)
        before_paid = obj.paid_amount if obj.paid_amount is not None else Decimal("0.00")
        total = obj.total_amount if obj.total_amount is not None else Decimal("0.00")
        new_paid = before_paid + data.amount
        if obj.payment_status in {PaymentStatus.CANCELLED, PaymentStatus.REFUNDED}:
            raise ApplicationError("payment_invalid_state", "Impossible de payer une vente annulée ou remboursée", 422)
        if new_paid > total:
            raise ApplicationError("payment_exceeds_balance", "Le paiement dépasse le montant restant dû", 422)
        obj.paid_amount = new_paid

        if new_paid >= total and total > 0:
            obj.payment_status = PaymentStatus.PAID
            if obj.document_type == DocumentType.INVOICE:
                obj.document_type = DocumentType.RECEIPT
        elif new_paid > 0:
            obj.payment_status = PaymentStatus.PARTIAL

        if data.payment_method:
            obj.payment_method = data.payment_method

        history_entry = {
            "date": str(data.payment_date or date.today()),
            "amount": str(data.amount),
            "method": data.payment_method,
            "comment": data.comment or "Règlement acompte / solde",
            "recorded_by": user,
            "resulting_balance": str(max(Decimal("0.00"), total - new_paid)),
        }
        current_history = list(obj.payment_history or [])
        current_history.append(history_entry)
        obj.payment_history = current_history
        obj.updated_by_user_id = user

        await self._history(s, org, "sale", rid, "payment_recorded", user, dict(history_entry))
        await s.commit()
        await s.refresh(obj)
        return obj

    async def convert_sale_document(
        self, s: AsyncSession, org: str, user: str, rid: str, data: ConvertDocumentRequest
    ) -> Sale:
        obj = await self.get_sale(s, org, rid)
        before_type = obj.document_type
        obj.document_type = data.target_type
        if data.due_date:
            obj.due_date = data.due_date

        if (
            before_type in (DocumentType.QUOTE, DocumentType.PROFORMA)
            and data.target_type == DocumentType.INVOICE
        ):
            if obj.reference.startswith("DEV-") or obj.reference.startswith("PRO-"):
                obj.reference = await generate_next_sale_reference(s, org, DocumentType.INVOICE)
        elif before_type != DocumentType.RECEIPT and data.target_type == DocumentType.RECEIPT:
            if obj.paid_amount < obj.total_amount or obj.payment_status != PaymentStatus.PAID:
                raise ApplicationError("receipt_requires_payment", "Une facture ne peut être acquittée sans règlement enregistré", 422)

        obj.updated_by_user_id = user
        await self._history(
            s,
            org,
            "sale",
            rid,
            "document_converted",
            user,
            {"from": str(before_type), "to": str(data.target_type), "new_ref": obj.reference},
        )
        await s.commit()
        await s.refresh(obj)
        return obj

    async def adjust_stock(self, s, org, user, rid, data: StockAdjustmentRequest):
        obj = await self.get_offer(s, org, rid)
        before_stock = obj.stock_quantity if obj.stock_quantity is not None else Decimal("0.00")
        obj.stock_quantity = max(Decimal("0.00"), before_stock + data.quantity_delta)
        obj.track_stock = True
        obj.updated_by_user_id = user
        await self._history(
            s,
            org,
            "offer",
            rid,
            "stock_adjusted",
            user,
            {
                "delta": str(data.quantity_delta),
                "reason": data.reason,
                "before": str(before_stock),
                "after": str(obj.stock_quantity),
                "notes": data.notes,
            },
        )
        await s.commit()
        await s.refresh(obj)
        return obj

    async def list_sales(self, s, org, q, payment_status, page, size):
        stmt = select(Sale).where(Sale.organization_id == org, Sale.is_archived.is_(False))
        count = (
            select(func.count())
            .select_from(Sale)
            .where(Sale.organization_id == org, Sale.is_archived.is_(False))
        )
        if payment_status:
            stmt = stmt.where(Sale.payment_status == payment_status)
            count = count.where(Sale.payment_status == payment_status)
        if q:
            cond = or_(
                Sale.reference.ilike(f"%{q}%"),
                Sale.client_name.ilike(f"%{q}%"),
                Sale.item_label.ilike(f"%{q}%"),
            )
            stmt = stmt.where(cond)
            count = count.where(cond)
        return list(
            (
                await s.scalars(
                    stmt.order_by(Sale.sale_date.desc()).offset((page - 1) * size).limit(size)
                )
            ).all()
        ), int(await s.scalar(count) or 0)

    async def get_sale(self, s, org, rid):
        obj = await s.scalar(select(Sale).where(Sale.id == rid, Sale.organization_id == org))
        if not obj:
            raise ApplicationError("sale_not_found", "Vente introuvable", 404)
        return obj

    async def update_sale(self, s, org, user, rid, data: SaleUpdate):
        obj = await self.get_sale(s, org, rid)
        values = data.model_dump(exclude_unset=True)
        before = {k: getattr(obj, k) for k in values}
        if "offer_id" in values and values["offer_id"]:
            await self.get_offer(s, org, values["offer_id"])
        for k, v in values.items():
            setattr(obj, k, v)
        if data.total_amount is None and {"quantity", "unit_price", "discount"} & values.keys():
            obj.total_amount = max(Decimal("0"), obj.quantity * obj.unit_price - obj.discount)
        obj.updated_by_user_id = user
        await self._history(s, org, "sale", rid, "updated", user, diff(before, values))
        await s.commit()
        await s.refresh(obj)
        return obj

    async def create_procedure(self, s, org, user, data: ProcedureCreate):
        values = data.model_dump(exclude={"steps"})
        obj = Procedure(
            organization_id=org, created_by_user_id=user, updated_by_user_id=user, **values
        )
        s.add(obj)
        await s.flush()
        await self._replace_steps(s, obj.id, data.steps)
        await self._history(
            s, org, "procedure", obj.id, "created", user, data.model_dump(mode="json")
        )
        await s.commit()
        return await self.get_procedure(s, org, obj.id)

    async def _replace_steps(self, s, pid, steps):
        await s.execute(delete(ProcedureStep).where(ProcedureStep.procedure_id == pid))
        s.add_all(
            [
                ProcedureStep(procedure_id=pid, **x.model_dump())
                for x in sorted(steps, key=lambda x: x.position)
            ]
        )

    async def get_procedure(self, s, org, rid):
        obj = await s.scalar(
            select(Procedure).where(Procedure.id == rid, Procedure.organization_id == org)
        )
        if not obj:
            raise ApplicationError("procedure_not_found", "Procédure introuvable", 404)
        rows = list(
            (
                await s.scalars(
                    select(ProcedureStep)
                    .where(ProcedureStep.procedure_id == rid)
                    .order_by(ProcedureStep.position)
                )
            ).all()
        )
        obj.steps = rows
        return obj

    async def list_procedures(self, s, org, q, status, department, page, size):
        stmt = select(Procedure).where(
            Procedure.organization_id == org, Procedure.is_archived.is_(False)
        )
        count = (
            select(func.count())
            .select_from(Procedure)
            .where(Procedure.organization_id == org, Procedure.is_archived.is_(False))
        )
        for cond in ([Procedure.status == status] if status else []) + (
            [Procedure.department == department] if department else []
        ):
            stmt = stmt.where(cond)
            count = count.where(cond)
        if q:
            cond = or_(Procedure.title.ilike(f"%{q}%"), Procedure.objective.ilike(f"%{q}%"))
            stmt = stmt.where(cond)
            count = count.where(cond)
        items = list(
            (
                await s.scalars(
                    stmt.order_by(Procedure.created_at.desc()).offset((page - 1) * size).limit(size)
                )
            ).all()
        )
        for x in items:
            x.steps = list(
                (
                    await s.scalars(
                        select(ProcedureStep)
                        .where(ProcedureStep.procedure_id == x.id)
                        .order_by(ProcedureStep.position)
                    )
                ).all()
            )
        return items, int(await s.scalar(count) or 0)

    async def update_procedure(self, s, org, user, rid, data: ProcedureUpdate):
        obj = await self.get_procedure(s, org, rid)
        values = data.model_dump(exclude_unset=True, exclude={"steps"})
        before = {k: getattr(obj, k) for k in values}
        for k, v in values.items():
            setattr(obj, k, v)
        if data.steps is not None:
            await self._replace_steps(s, rid, data.steps)
        obj.version += 1
        obj.updated_by_user_id = user
        await self._history(s, org, "procedure", rid, "updated", user, diff(before, values))
        await s.commit()
        return await self.get_procedure(s, org, rid)

    async def archive(self, s, org, user, typ, rid):
        getter = {"offer": self.get_offer, "sale": self.get_sale, "procedure": self.get_procedure}[
            typ
        ]
        obj = await getter(s, org, rid)
        obj.is_archived = True
        obj.updated_by_user_id = user
        await self._history(s, org, typ, rid, "archived", user, {})
        await s.commit()

    async def update_sale_payment_status(
        self, s, org, user, rid, payment_status, payment_method=None
    ):
        obj = await self.get_sale(s, org, rid)
        before = {"payment_status": obj.payment_status, "payment_method": obj.payment_method}
        next_status = PaymentStatus(payment_status)
        current_paid = obj.paid_amount or Decimal("0")
        if next_status == PaymentStatus.PAID:
            obj.paid_amount = obj.total_amount
        elif next_status == PaymentStatus.PARTIAL and not (Decimal("0") < current_paid < obj.total_amount):
            raise ApplicationError("partial_requires_amount", "Enregistrer un acompte avant de marquer la vente partielle", 422)
        elif next_status == PaymentStatus.UNPAID and current_paid > 0:
            raise ApplicationError("unpaid_with_payment", "Impossible de déclarer impayée une vente déjà encaissée", 422)
        obj.payment_status = next_status
        if payment_method is not None:
            obj.payment_method = payment_method
        obj.updated_by_user_id = user
        await self._history(
            s,
            org,
            "sale",
            rid,
            "payment_status_updated",
            user,
            {
                "before": before,
                "after": {"payment_status": payment_status, "payment_method": obj.payment_method},
            },
        )
        await s.commit()
        await s.refresh(obj)
        return obj

    async def get_summary(self, s, org):
        # Single source of truth, shared with the private executive cockpit.
        from app.services.financial_summary import fetch_summary

        return await fetch_summary(s, org)

    async def history(self, s, org, typ, rid):
        return list(
            (
                await s.scalars(
                    select(RecordHistory)
                    .where(
                        RecordHistory.organization_id == org,
                        RecordHistory.record_type == typ,
                        RecordHistory.record_id == rid,
                    )
                    .order_by(RecordHistory.created_at.desc())
                )
            ).all()
        )

    # ------------------ EXPENSES ------------------
    async def create_expense(self, s: AsyncSession, org: str, user: str, data: ExpenseCreate):
        values = data.model_dump()
        doc_type = data.document_type or ExpenseDocumentType.EXPENSE_RECEIPT
        values["document_type"] = doc_type

        ref = (values.get("reference") or "").strip()
        if not ref or ref.lower() in ("auto", "nouveau", "new", "ref", "string", "null"):
            ref = await generate_next_expense_reference(s, org, doc_type)
        values["reference"] = ref

        paid_amount = values.get("paid_amount")
        if paid_amount is None and values.get("payment_status") == PaymentStatus.PAID:
            paid_amount = values["amount"]
        values["paid_amount"] = paid_amount

        obj = Expense(
            organization_id=org,
            created_by_user_id=user,
            updated_by_user_id=user,
            **values,
        )
        s.add(obj)
        await s.flush()
        await self._history(
            s, org, "expenses", obj.id, "create", user, {"reference": obj.reference}
        )
        await s.commit()
        await s.refresh(obj)
        return obj

    async def list_expenses(
        self,
        s: AsyncSession,
        org: str,
        page: int = 1,
        page_size: int = 50,
        q: str | None = None,
        category: str | None = None,
        payment_status: str | None = None,
    ):
        stmt = select(Expense).where(Expense.organization_id == org, Expense.is_archived.is_(False))
        if category:
            stmt = stmt.where(Expense.category == category)
        if payment_status:
            stmt = stmt.where(Expense.payment_status == payment_status)
        if q:
            stmt = stmt.where(
                or_(
                    Expense.reference.ilike(f"%{q}%"),
                    Expense.beneficiary.ilike(f"%{q}%"),
                    Expense.category.ilike(f"%{q}%"),
                    Expense.comment.ilike(f"%{q}%"),
                )
            )
        total = int(await s.scalar(select(func.count()).select_from(stmt.subquery())) or 0)
        items = list(
            (
                await s.scalars(
                    stmt.order_by(Expense.expense_date.desc(), Expense.created_at.desc())
                    .offset((page - 1) * page_size)
                    .limit(page_size)
                )
            ).all()
        )
        return {"items": items, "total": total, "page": page, "page_size": page_size}

    async def get_expense(self, s: AsyncSession, org: str, rid: str):
        obj = await s.scalar(
            select(Expense).where(
                Expense.organization_id == org, Expense.id == rid, Expense.is_archived.is_(False)
            )
        )
        if not obj:
            raise ApplicationError("not_found", "Dépense introuvable", 404)
        return obj

    async def update_expense(
        self, s: AsyncSession, org: str, user: str, rid: str, data: ExpenseUpdate
    ):
        obj = await self.get_expense(s, org, rid)
        before = {
            "amount": str(obj.amount),
            "payment_status": str(obj.payment_status),
            "category": obj.category,
        }
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(obj, k, v)
        obj.updated_by_user_id = user
        await s.flush()
        after = {
            "amount": str(obj.amount),
            "payment_status": str(obj.payment_status),
            "category": obj.category,
        }
        await self._history(s, org, "expenses", obj.id, "update", user, diff(before, after))
        await s.commit()
        await s.refresh(obj)
        return obj

    async def update_expense_payment_status(
        self, s: AsyncSession, org: str, user: str, rid: str, status: str, method: str | None = None
    ):
        obj = await self.get_expense(s, org, rid)
        before = {"payment_status": str(obj.payment_status), "payment_method": obj.payment_method}
        next_status = PaymentStatus(status)
        if next_status == PaymentStatus.PAID:
            # An explicit user action declaring full payment must update its amount.
            obj.paid_amount = obj.amount
        elif next_status == PaymentStatus.PARTIAL:
            current_paid = obj.paid_amount or Decimal("0.00")
            if not (Decimal("0.00") < current_paid < obj.amount):
                raise ApplicationError("partial_requires_amount", "Saisir le montant partiellement réglé avant de déclarer une dépense partielle", 422)
        elif next_status == PaymentStatus.UNPAID and (obj.paid_amount or Decimal("0.00")) > 0:
            raise ApplicationError("unpaid_with_payment", "Modifier le montant payé avant de déclarer la dépense impayée", 422)
        obj.payment_status = next_status
        if method is not None:
            obj.payment_method = method
        obj.updated_by_user_id = user
        await s.flush()
        after = {"payment_status": str(obj.payment_status), "payment_method": obj.payment_method}
        await self._history(
            s, org, "expenses", obj.id, "update_payment_status", user, diff(before, after)
        )
        await s.commit()
        await s.refresh(obj)
        return obj

    async def delete_expense(self, s: AsyncSession, org: str, user: str, rid: str):
        obj = await self.get_expense(s, org, rid)
        obj.is_archived = True
        obj.updated_by_user_id = user
        await s.flush()
        await self._history(s, org, "expenses", obj.id, "archive", user, {})
        await s.commit()
        return {"ok": True}

    # ------------------ SUPPLIERS ------------------
    async def create_supplier(self, s: AsyncSession, org: str, user: str, data: SupplierCreate):
        obj = Supplier(
            organization_id=org,
            name=data.name,
            category=data.category,
            contact_name=data.contact_name,
            phone=data.phone,
            email=data.email,
            address=data.address,
            payment_terms=data.payment_terms,
            created_by_user_id=user,
            updated_by_user_id=user,
        )
        s.add(obj)
        await s.flush()
        await self._history(s, org, "suppliers", obj.id, "create", user, {"name": obj.name})
        await s.commit()
        await s.refresh(obj)
        return obj

    async def list_suppliers(
        self, s: AsyncSession, org: str, page: int = 1, page_size: int = 50, q: str | None = None
    ):
        stmt = select(Supplier).where(Supplier.organization_id == org)
        if q:
            stmt = stmt.where(
                or_(
                    Supplier.name.ilike(f"%{q}%"),
                    Supplier.contact_name.ilike(f"%{q}%"),
                    Supplier.phone.ilike(f"%{q}%"),
                    Supplier.email.ilike(f"%{q}%"),
                )
            )
        total = int(await s.scalar(select(func.count()).select_from(stmt.subquery())) or 0)
        items = list(
            (
                await s.scalars(
                    stmt.order_by(Supplier.name.asc())
                    .offset((page - 1) * page_size)
                    .limit(page_size)
                )
            ).all()
        )
        return {"items": items, "total": total, "page": page, "page_size": page_size}

    async def get_supplier(self, s: AsyncSession, org: str, rid: str):
        obj = await s.scalar(
            select(Supplier).where(Supplier.organization_id == org, Supplier.id == rid)
        )
        if not obj:
            raise ApplicationError("not_found", "Fournisseur introuvable", 404)
        return obj

    async def update_supplier(
        self, s: AsyncSession, org: str, user: str, rid: str, data: SupplierUpdate
    ):
        obj = await self.get_supplier(s, org, rid)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(obj, k, v)
        obj.updated_by_user_id = user
        await s.flush()
        await self._history(s, org, "suppliers", obj.id, "update", user, {"name": obj.name})
        await s.commit()
        await s.refresh(obj)
        return obj

    async def delete_supplier(self, s: AsyncSession, org: str, user: str, rid: str):
        obj = await self.get_supplier(s, org, rid)
        await s.delete(obj)
        await s.flush()
        await self._history(s, org, "suppliers", rid, "delete", user, {})
        await s.commit()
        return {"ok": True}

    # ------------------ CASHFLOW SUMMARY ------------------
    async def get_cashflow_summary(self, s: AsyncSession, org: str):
        """Operational payment-register view, not a reconciled cash forecast."""
        from app.services.financial_metrics import collect_financial_registers

        snap = await collect_financial_registers(s, org)
        sm = snap.summary
        return {
            "total_income_paid": sm["total_paid_amount"],
            "total_income_unpaid": sm["total_unpaid_amount"],
            "total_expenses_paid": sm["total_expenses_paid"],
            "total_expenses_unpaid": sm["total_expenses_unpaid"],
            "net_cash_position": None,
            "cash_movement_net": sm["cash_movement_net"],
            "projected_30d_cash": None,
            "estimated_gross_margin": None,
            "primary_currency": sm["primary_currency"],
            "financial_data_status": sm["financial_data_status"],
            "financial_warnings": sm["financial_warnings"],
            "receivables_overdue": sm["receivables_overdue"],
            "receivables_not_due": sm["receivables_not_due"],
            "recent_expenses": list(snap.expenses[:10]),
        }

    # ------------------ SMART DOCUMENTS VIVANTS ------------------
    async def get_public_document(
        self, s: AsyncSession, token: str, increment_view: bool = True
    ) -> PublicDocumentRead:
        stmt = select(Sale).where(Sale.public_token == token, Sale.is_archived.is_(False))
        sale = await s.scalar(stmt)
        if not sale:
            raise ApplicationError("document_not_found", "Ce document est introuvable ou le lien a expiré.", 404)

        org = await s.get(Organization, sale.organization_id)
        org_name = org.name if org else "Entreprise KORYXA"

        if increment_view:
            sale.view_count = (sale.view_count or 0) + 1
            sale.last_viewed_at = datetime.now(UTC)
            await s.commit()
            await s.refresh(sale)

        total = sale.total_amount if sale.total_amount is not None else Decimal("0.00")
        paid = sale.paid_amount if sale.paid_amount is not None else Decimal("0.00")
        remaining = max(Decimal("0.00"), total - paid)

        return PublicDocumentRead(
            token=sale.public_token,
            id=sale.id,
            reference=sale.reference,
            document_type=sale.document_type,
            sale_date=sale.sale_date,
            due_date=sale.due_date,
            item_label=sale.item_label,
            quantity=sale.quantity,
            unit_price=sale.unit_price,
            discount=sale.discount,
            total_amount=total,
            paid_amount=paid,
            remaining_balance=remaining,
            currency=sale.currency or "XOF",
            payment_status=sale.payment_status,
            payment_method=sale.payment_method,
            payment_history=list(sale.payment_history or []),
            comment=sale.comment,
            organization_id=sale.organization_id,
            organization_name=org_name,
            organization_commercial_name=org_name,
            organization_phone=None,
            organization_email=None,
            organization_address=org.country if org else None,
            organization_logo_url=None,
            client_name=sale.client_name,
            client_phone=sale.client_phone,
            client_email=sale.client_email,
            signed_at=sale.signed_at,
            signed_by_name=sale.signed_by_name,
            signature_data=sale.signature_data,
            view_count=sale.view_count or 0,
            last_viewed_at=sale.last_viewed_at,
        )

    async def sign_public_document(
        self, s: AsyncSession, token: str, data: PublicDocumentSignRequest
    ) -> PublicDocumentRead:
        stmt = select(Sale).where(Sale.public_token == token, Sale.is_archived.is_(False))
        sale = await s.scalar(stmt)
        if not sale:
            raise ApplicationError("document_not_found", "Document introuvable.", 404)

        now = datetime.now(UTC)
        sale.signed_at = now
        sale.signed_by_name = data.signer_name.strip()
        sale.signature_data = data.signature_data

        if sale.document_type == DocumentType.QUOTE:
            sale.status = RecordStatus.VALIDATED

        await self._history(
            s,
            sale.organization_id,
            "sale",
            sale.id,
            "client_signed",
            "client:public",
            {"signed_by": data.signer_name, "signed_at": now.isoformat()},
        )
        await s.commit()
        await s.refresh(sale)
        return await self.get_public_document(s, token, increment_view=False)

    async def pay_public_document(
        self, s: AsyncSession, token: str, data: PublicDocumentPayRequest
    ) -> tuple[PublicDocumentRead, str]:
        stmt = select(Sale).where(Sale.public_token == token, Sale.is_archived.is_(False))
        sale = await s.scalar(stmt)
        if not sale:
            raise ApplicationError("document_not_found", "Document introuvable.", 404)

        total = sale.total_amount if sale.total_amount is not None else Decimal("0.00")
        current_paid = sale.paid_amount if sale.paid_amount is not None else Decimal("0.00")
        remaining = max(Decimal("0.00"), total - current_paid)

        if remaining <= Decimal("0.00"):
            raise ApplicationError("already_paid", "Ce document est déjà intégralement réglé.", 422)

        amount = min(data.amount, remaining)
        new_paid = current_paid + amount
        sale.paid_amount = new_paid

        if new_paid >= total and total > Decimal("0.00"):
            sale.payment_status = PaymentStatus.PAID
            if sale.document_type in (DocumentType.QUOTE, DocumentType.PROFORMA, DocumentType.INVOICE):
                sale.document_type = DocumentType.RECEIPT
        else:
            sale.payment_status = PaymentStatus.PARTIAL

        provider_label = data.payment_method.replace("_", " ").upper()
        sale.payment_method = f"Mobile Money ({provider_label})"

        tx_id = f"PAY-{uuid4().hex[:10].upper()}"
        history_entry = {
            "date": date.today().isoformat(),
            "amount": str(amount),
            "method": provider_label,
            "transaction_id": tx_id,
            "payer_name": data.payer_name or sale.client_name or "Client",
            "client_phone": data.client_phone or sale.client_phone,
            "comment": f"Paiement Mobile Money 1-Clic via {provider_label}",
            "source": "online_smartdoc",
            "resulting_balance": str(max(Decimal("0.00"), total - new_paid)),
        }
        history = list(sale.payment_history or [])
        history.append(history_entry)
        sale.payment_history = history

        await self._history(
            s,
            sale.organization_id,
            "sale",
            sale.id,
            "online_payment_received",
            "client:public",
            dict(history_entry),
        )

        try:
            await add_financial_audit(
                session=s,
                organization_id=sale.organization_id,
                event_type="smartdoc_payment",
                actor_id=data.payer_name or "client:public",
                entity_type="sale",
                entity_id=sale.id,
                payload={
                    "transaction_id": tx_id,
                    "amount": str(amount),
                    "provider": data.payment_method,
                    "new_balance": str(max(Decimal("0.00"), total - new_paid)),
                    "total_amount": str(total),
                },
            )
        except Exception:
            pass

        await s.commit()
        await s.refresh(sale)
        doc = await self.get_public_document(s, token, increment_view=False)
        return doc, tx_id
