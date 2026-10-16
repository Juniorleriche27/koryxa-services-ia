"""Explicit financial evidence APIs; every operation is tenant-scoped."""
from datetime import date
from decimal import Decimal
from typing import Annotated, Literal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, model_validator
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.identity import KoryxaIdentity, require_koryxa_identity
from app.core.permissions import get_current_organization, require_permission
from app.db.session import get_session
from app.models.finance import CashAccount, CashMovement, FinancialCostClassification
from app.models.organization import Organization
from app.models.registers import Expense
from app.services.finance_ledger import account_balances, direct_cost_coverage
from app.services.financial_audit import add_financial_audit

router = APIRouter()
Session = Annotated[AsyncSession, Depends(get_session)]
Org = Annotated[Organization, Depends(get_current_organization)]
Read = Annotated[object, Depends(require_permission("registers:read"))]
Manage = Annotated[object, Depends(require_permission("registers:manage"))]
Identity = Annotated[KoryxaIdentity, Depends(require_koryxa_identity)]


class AccountIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    currency: str = Field(min_length=3, max_length=3)
    opening_balance: Decimal | None = None
    opening_date: date | None = None

    @model_validator(mode="after")
    def validate_balance_date(self):
        if (self.opening_balance is None) != (self.opening_date is None):
            raise ValueError("Le montant et la date du solde initial doivent être renseignés ensemble")
        return self


class OpeningBalanceIn(BaseModel):
    opening_balance: Decimal = Field(max_digits=18, decimal_places=2)
    opening_date: date


class MovementIn(BaseModel):
    account_id: str
    occurred_on: date
    amount: Decimal = Field(gt=0, max_digits=18, decimal_places=2)
    direction: Literal["in", "out"]
    category: Literal["sale_payment", "expense_payment", "capital", "withdrawal", "loan", "loan_repayment", "transfer", "other"]
    note: str | None = Field(default=None, max_length=1000)
    source_kind: str | None = Field(default=None, max_length=40)
    source_id: str | None = Field(default=None, max_length=36)


class TransferIn(BaseModel):
    source_account_id: str
    target_account_id: str
    occurred_on: date
    amount: Decimal = Field(gt=0, max_digits=18, decimal_places=2)
    note: str | None = Field(default=None, max_length=1000)


class CostIn(BaseModel):
    behavior: Literal["fixed", "variable", "unknown"]
    relation: Literal["direct", "indirect", "unknown"]
    note: str | None = Field(default=None, max_length=1000)


@router.get("/accounts")
async def accounts(s: Session, org: Org, _: Read):
    return await account_balances(s, org.id)


@router.post("/accounts", status_code=201)
async def add_account(data: AccountIn, s: Session, org: Org, _: Manage, identity: Identity):
    existing = await s.scalar(select(CashAccount).where(CashAccount.organization_id == org.id, CashAccount.name == data.name.strip()))
    if existing:
        raise HTTPException(409, "Un compte portant ce nom existe déjà")
    obj = CashAccount(id=str(uuid4()), organization_id=org.id, name=data.name.strip(), currency=data.currency.upper(),
                      opening_balance=data.opening_balance, opening_date=data.opening_date,
                      created_by_user_id=identity.user_id)
    s.add(obj)
    add_financial_audit(s, organization_id=org.id, entity_type="cash_account",
                        entity_id=obj.id, event_type="created", actor_user_id=identity.user_id,
                        payload={"name": obj.name, "currency": obj.currency,
                                 "opening_balance": obj.opening_balance,
                                 "opening_date": obj.opening_date})
    await s.commit()
    return {"id": obj.id, "status": "created", "balance_known": data.opening_balance is not None}


@router.patch("/accounts/{account_id}/opening")
async def set_opening_balance(account_id: str, data: OpeningBalanceIn, s: Session, org: Org, _: Manage, identity: Identity):
    account = await s.scalar(select(CashAccount).where(
        CashAccount.id == account_id, CashAccount.organization_id == org.id,
    ))
    if not account:
        raise HTTPException(404, "Compte introuvable")
    if account.opening_balance is not None or account.opening_date is not None:
        raise HTTPException(409, "Le solde initial est déjà défini; une correction nécessite une procédure auditée")
    prior_movement = await s.scalar(select(CashMovement.id).where(
        CashMovement.organization_id == org.id,
        CashMovement.account_id == account.id,
        CashMovement.occurred_on < data.opening_date,
    ).limit(1))
    if prior_movement:
        raise HTTPException(422, "Des mouvements précèdent cette date; rapprochez le compte avant de fixer le solde")
    account.opening_balance = data.opening_balance
    account.opening_date = data.opening_date
    add_financial_audit(s, organization_id=org.id, entity_type="cash_account",
                        entity_id=account.id, event_type="opening_balance_declared",
                        actor_user_id=identity.user_id,
                        payload={"opening_balance": data.opening_balance,
                                 "opening_date": data.opening_date})
    await s.commit()
    return {"account_id": account.id, "opening_status": "declared", "entered_by_user_id": identity.user_id}


@router.post("/movements", status_code=201)
async def add_movement(data: MovementIn, s: Session, org: Org, _: Manage, identity: Identity):
    account = await s.scalar(select(CashAccount).where(CashAccount.organization_id == org.id, CashAccount.id == data.account_id))
    if not account:
        raise HTTPException(404, "Compte financier introuvable")
    if account.opening_date and data.occurred_on < account.opening_date:
        raise HTTPException(422, "Le mouvement précède la date du solde d'ouverture")
    if data.category == "transfer":
        raise HTTPException(422, "Un transfert nécessite une écriture équilibrée à deux comptes; utilisez l'endpoint dédié")
    if (data.source_kind is None) != (data.source_id is None):
        raise HTTPException(422, "La source requiert un type et un identifiant")
    if data.source_id:
        exists = await s.scalar(select(CashMovement).where(
            CashMovement.organization_id == org.id, CashMovement.source_kind == data.source_kind,
            CashMovement.source_id == data.source_id, CashMovement.direction == data.direction,
        ))
        if exists:
            raise HTTPException(409, "Ce mouvement source est déjà enregistré")
        # No arbitrary foreign-tenant source may be represented as a verified payment.
        if data.category in {"sale_payment", "expense_payment"}:
            raise HTTPException(422, "Les paiements issus des registres doivent être rapprochés via un service dédié")
    obj = CashMovement(id=str(uuid4()), organization_id=org.id, account_id=account.id,
                       occurred_on=data.occurred_on, amount=data.amount, direction=data.direction,
                       category=data.category, note=data.note, source_kind=data.source_kind,
                       source_id=data.source_id, created_by_user_id=identity.user_id)
    s.add(obj)
    add_financial_audit(s, organization_id=org.id, entity_type="cash_movement",
                        entity_id=obj.id, event_type="recorded", actor_user_id=identity.user_id,
                        payload={"account_id": account.id, "occurred_on": data.occurred_on,
                                 "amount": data.amount, "direction": data.direction,
                                 "category": data.category, "source_kind": data.source_kind,
                                 "source_id": data.source_id})
    try:
        await s.commit()
    except IntegrityError as exc:
        await s.rollback()
        # Database uniqueness is the final guard against concurrent requests.
        raise HTTPException(409, "Ce mouvement source est déjà enregistré") from exc
    return {"id": obj.id, "status": "recorded"}


@router.post("/transfers", status_code=201)
async def transfer(data: TransferIn, s: Session, org: Org, _: Manage, identity: Identity):
    if data.source_account_id == data.target_account_id:
        raise HTTPException(422, "Les comptes source et destination doivent être distincts")
    accounts = (await s.scalars(select(CashAccount).where(
        CashAccount.organization_id == org.id,
        CashAccount.id.in_([data.source_account_id, data.target_account_id]),
    ))).all()
    by_id = {a.id: a for a in accounts}
    if len(by_id) != 2:
        raise HTTPException(404, "Compte source ou destinataire introuvable")
    source, target = by_id[data.source_account_id], by_id[data.target_account_id]
    if source.currency != target.currency:
        raise HTTPException(422, "Transferts interdevises non pris en charge sans taux de change")
    if any(a.opening_date is not None and a.opening_date > data.occurred_on for a in accounts):
        raise HTTPException(422, "Transfert antérieur à la date d'ouverture")
    transfer_id = str(uuid4())
    for acc, direction in ((source, "out"), (target, "in")):
        movement = CashMovement(
            id=str(uuid4()), organization_id=org.id, account_id=acc.id,
            occurred_on=data.occurred_on, amount=data.amount, direction=direction,
            category="transfer", transfer_group_id=transfer_id, note=data.note,
            created_by_user_id=identity.user_id,
        )
        s.add(movement)
        add_financial_audit(s, organization_id=org.id, entity_type="cash_movement",
                            entity_id=movement.id, event_type="transfer_leg_recorded",
                            actor_user_id=identity.user_id,
                            payload={"transfer_group_id": transfer_id, "account_id": acc.id,
                                     "direction": direction, "amount": data.amount,
                                     "currency": source.currency, "occurred_on": data.occurred_on})
    await s.commit()
    return {"transfer_id": transfer_id, "legs": 2, "currency": source.currency}


@router.get("/cost-coverage")
async def cost_coverage(s: Session, org: Org, _: Read):
    return await direct_cost_coverage(s, org.id)


@router.put("/expenses/{expense_id}/classification")
async def classify_expense(expense_id: str, data: CostIn, s: Session, org: Org, _: Manage, identity: Identity):
    expense = await s.scalar(select(Expense).where(Expense.id == expense_id, Expense.organization_id == org.id))
    if not expense:
        raise HTTPException(404, "Dépense introuvable")
    current = await s.scalar(select(FinancialCostClassification).where(
        FinancialCostClassification.expense_id == expense_id,
        FinancialCostClassification.organization_id == org.id,
    ))
    if current is None:
        current = FinancialCostClassification(id=str(uuid4()), organization_id=org.id, expense_id=expense_id)
        s.add(current)
    current.behavior = data.behavior
    current.relation = data.relation
    current.note = data.note
    current.updated_by_user_id = identity.user_id
    add_financial_audit(s, organization_id=org.id, entity_type="expense_classification",
                        entity_id=current.id, event_type="classified",
                        actor_user_id=identity.user_id,
                        payload={"expense_id": expense_id, "behavior": data.behavior,
                                 "relation": data.relation})
    await s.commit()
    return {"expense_id": expense_id, "behavior": data.behavior, "relation": data.relation}
