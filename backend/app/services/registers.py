# mypy: disable-error-code="no-untyped-def,no-untyped-call"
from __future__ import annotations

from decimal import Decimal

from sqlalchemy import delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ApplicationError
from app.models.registers import Offer, Procedure, ProcedureStep, RecordHistory, Sale
from app.schemas.registers import (
    OfferCreate,
    OfferUpdate,
    ProcedureCreate,
    ProcedureUpdate,
    SaleCreate,
    SaleUpdate,
)


def diff(before: dict[str, object], after: dict[str, object]) -> dict[str, object]:
    return {
        k: {"before": before.get(k), "after": v} for k, v in after.items() if before.get(k) != v
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
        if data.offer_id:
            await self.get_offer(s, org, data.offer_id)
        values = data.model_dump()
        values["total_amount"] = (
            data.total_amount
            if data.total_amount is not None
            else max(Decimal("0"), data.quantity * data.unit_price - data.discount)
        )
        obj = Sale(organization_id=org, created_by_user_id=user, updated_by_user_id=user, **values)
        s.add(obj)
        await s.flush()
        await self._history(
            s, org, "sale", obj.id, "created", user, {k: str(v) for k, v in values.items()}
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
