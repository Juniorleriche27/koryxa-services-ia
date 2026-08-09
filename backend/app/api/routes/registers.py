# mypy: disable-error-code="no-untyped-def,no-untyped-call"
# ruff: noqa: B008
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.identity import KoryxaIdentity, require_koryxa_identity
from app.core.permissions import get_current_organization, require_permission
from app.db.session import get_session
from app.models.member import OrganizationMember
from app.models.organization import Organization
from app.models.registers import PaymentStatus, RecordStatus
from app.schemas.registers import (
    CashflowSummary,
    ExpenseCreate,
    ExpensePaymentUpdate,
    ExpenseRead,
    ExpenseUpdate,
    HistoryRead,
    OfferCreate,
    OfferRead,
    OfferUpdate,
    Page,
    ProcedureCreate,
    ProcedureRead,
    ProcedureUpdate,
    RegistersSummary,
    SaleCreate,
    SalePaymentUpdate,
    SaleRead,
    SaleUpdate,
    SupplierCreate,
    SupplierRead,
    SupplierUpdate,
)

from app.services.registers import RegisterService

router = APIRouter()
SessionDep = Annotated[AsyncSession, Depends(get_session)]
IdentityDep = Annotated[KoryxaIdentity, Depends(require_koryxa_identity)]
OrgDep = Annotated[Organization, Depends(get_current_organization)]
ReadDep = Annotated[OrganizationMember, Depends(require_permission("registers:read"))]
ManageDep = Annotated[OrganizationMember, Depends(require_permission("registers:manage"))]
svc = RegisterService()


@router.post("/offers", response_model=OfferRead, status_code=201)
async def create_offer(data: OfferCreate, s: SessionDep, i: IdentityDep, o: OrgDep, _: ManageDep):
    return await svc.create_offer(s, o.id, i.user_id, data)


@router.get("/offers", response_model=Page)
async def offers(
    s: SessionDep,
    o: OrgDep,
    _: ReadDep,
    q: str | None = None,
    status_: RecordStatus | None = Query(None, alias="status"),
    category: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    items, total = await svc.list_offers(s, o.id, q, status_, category, page, page_size)
    return Page(
        items=[OfferRead.model_validate(x) for x in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/offers/{rid}", response_model=OfferRead)
async def offer(rid: str, s: SessionDep, o: OrgDep, _: ReadDep):
    return await svc.get_offer(s, o.id, rid)


@router.patch("/offers/{rid}", response_model=OfferRead)
async def update_offer(
    rid: str, data: OfferUpdate, s: SessionDep, i: IdentityDep, o: OrgDep, _: ManageDep
):
    return await svc.update_offer(s, o.id, i.user_id, rid, data)


@router.post("/sales", response_model=SaleRead, status_code=201)
async def create_sale(data: SaleCreate, s: SessionDep, i: IdentityDep, o: OrgDep, _: ManageDep):
    return await svc.create_sale(s, o.id, i.user_id, data)


@router.get("/sales", response_model=Page)
async def sales(
    s: SessionDep,
    o: OrgDep,
    _: ReadDep,
    q: str | None = None,
    payment_status: PaymentStatus | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    items, total = await svc.list_sales(s, o.id, q, payment_status, page, page_size)
    return Page(
        items=[SaleRead.model_validate(x) for x in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/sales/{rid}", response_model=SaleRead)
async def sale(rid: str, s: SessionDep, o: OrgDep, _: ReadDep):
    return await svc.get_sale(s, o.id, rid)


@router.patch("/sales/{rid}", response_model=SaleRead)
async def update_sale(
    rid: str, data: SaleUpdate, s: SessionDep, i: IdentityDep, o: OrgDep, _: ManageDep
):
    return await svc.update_sale(s, o.id, i.user_id, rid, data)


@router.post("/procedures", response_model=ProcedureRead, status_code=201)
async def create_procedure(
    data: ProcedureCreate, s: SessionDep, i: IdentityDep, o: OrgDep, _: ManageDep
):
    return await svc.create_procedure(s, o.id, i.user_id, data)


@router.get("/procedures", response_model=Page)
async def procedures(
    s: SessionDep,
    o: OrgDep,
    _: ReadDep,
    q: str | None = None,
    status_: RecordStatus | None = Query(None, alias="status"),
    department: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    items, total = await svc.list_procedures(s, o.id, q, status_, department, page, page_size)
    return Page(
        items=[ProcedureRead.model_validate(x) for x in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/summary", response_model=RegistersSummary)
async def summary(s: SessionDep, o: OrgDep, _: ReadDep):
    return await svc.get_summary(s, o.id)


@router.patch("/sales/{rid}/payment-status", response_model=SaleRead)
async def update_sale_payment_status(
    rid: str, data: SalePaymentUpdate, s: SessionDep, i: IdentityDep, o: OrgDep, _: ManageDep
):
    return await svc.update_sale_payment_status(
        s, o.id, i.user_id, rid, data.payment_status, data.payment_method
    )


@router.get("/procedures/{rid}", response_model=ProcedureRead)
async def procedure(rid: str, s: SessionDep, o: OrgDep, _: ReadDep):
    return await svc.get_procedure(s, o.id, rid)


@router.patch("/procedures/{rid}", response_model=ProcedureRead)
async def update_procedure(
    rid: str, data: ProcedureUpdate, s: SessionDep, i: IdentityDep, o: OrgDep, _: ManageDep
):
    return await svc.update_procedure(s, o.id, i.user_id, rid, data)


@router.post("/{typ}/{rid}/archive", status_code=204)
async def archive(typ: str, rid: str, s: SessionDep, i: IdentityDep, o: OrgDep, _: ManageDep):
    if typ not in {"offer", "sale", "procedure"}:
        return Response(status_code=404)
    await svc.archive(s, o.id, i.user_id, typ, rid)
    return Response(status_code=204)


@router.get("/{typ}/{rid}/history", response_model=list[HistoryRead])
async def history(typ: str, rid: str, s: SessionDep, o: OrgDep, _: ReadDep):
    return await svc.history(s, o.id, typ, rid)


# ------------------ EXPENSES ENDPOINTS ------------------
@router.post("/expenses", response_model=ExpenseRead, status_code=201)
async def create_expense(data: ExpenseCreate, s: SessionDep, i: IdentityDep, o: OrgDep, _: ManageDep):
    return await svc.create_expense(s, o.id, i.user_id, data)


@router.get("/expenses", response_model=Page)
async def list_expenses(
    s: SessionDep,
    o: OrgDep,
    _: ReadDep,
    q: str | None = None,
    category: str | None = None,
    payment_status: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
):
    res = await svc.list_expenses(s, o.id, page, page_size, q, category, payment_status)
    return Page(
        items=[ExpenseRead.model_validate(x) for x in res["items"]],
        total=res["total"],
        page=page,
        page_size=page_size,
    )


@router.get("/expenses/{rid}", response_model=ExpenseRead)
async def get_expense(rid: str, s: SessionDep, o: OrgDep, _: ReadDep):
    return await svc.get_expense(s, o.id, rid)


@router.put("/expenses/{rid}", response_model=ExpenseRead)
async def update_expense(
    rid: str, data: ExpenseUpdate, s: SessionDep, i: IdentityDep, o: OrgDep, _: ManageDep
):
    return await svc.update_expense(s, o.id, i.user_id, rid, data)


@router.patch("/expenses/{rid}/payment-status", response_model=ExpenseRead)
async def update_expense_payment_status(
    rid: str, data: ExpensePaymentUpdate, s: SessionDep, i: IdentityDep, o: OrgDep, _: ManageDep
):
    return await svc.update_expense_payment_status(
        s, o.id, i.user_id, rid, data.payment_status, data.payment_method
    )


@router.delete("/expenses/{rid}", status_code=204)
async def delete_expense(rid: str, s: SessionDep, i: IdentityDep, o: OrgDep, _: ManageDep):
    await svc.delete_expense(s, o.id, i.user_id, rid)
    return Response(status_code=204)


# ------------------ SUPPLIERS ENDPOINTS ------------------
@router.post("/suppliers", response_model=SupplierRead, status_code=201)
async def create_supplier(data: SupplierCreate, s: SessionDep, i: IdentityDep, o: OrgDep, _: ManageDep):
    return await svc.create_supplier(s, o.id, i.user_id, data)


@router.get("/suppliers", response_model=Page)
async def list_suppliers(
    s: SessionDep,
    o: OrgDep,
    _: ReadDep,
    q: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
):
    res = await svc.list_suppliers(s, o.id, page, page_size, q)
    return Page(
        items=[SupplierRead.model_validate(x) for x in res["items"]],
        total=res["total"],
        page=page,
        page_size=page_size,
    )


@router.get("/suppliers/{rid}", response_model=SupplierRead)
async def get_supplier(rid: str, s: SessionDep, o: OrgDep, _: ReadDep):
    return await svc.get_supplier(s, o.id, rid)


@router.put("/suppliers/{rid}", response_model=SupplierRead)
async def update_supplier(
    rid: str, data: SupplierUpdate, s: SessionDep, i: IdentityDep, o: OrgDep, _: ManageDep
):
    return await svc.update_supplier(s, o.id, i.user_id, rid, data)


@router.delete("/suppliers/{rid}", status_code=204)
async def delete_supplier(rid: str, s: SessionDep, i: IdentityDep, o: OrgDep, _: ManageDep):
    await svc.delete_supplier(s, o.id, i.user_id, rid)
    return Response(status_code=204)


# ------------------ CASHFLOW SUMMARY ENDPOINT ------------------
@router.get("/cashflow-summary", response_model=CashflowSummary)
async def cashflow_summary(s: SessionDep, o: OrgDep, _: ReadDep):
    return await svc.get_cashflow_summary(s, o.id)


