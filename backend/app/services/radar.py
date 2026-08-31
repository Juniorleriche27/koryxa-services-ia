# mypy: disable-error-code="no-untyped-def,no-untyped-call,attr-defined,var-annotated,dict-item"
from __future__ import annotations

import hashlib
from datetime import date, timedelta
from decimal import Decimal, InvalidOperation

from sqlalchemy import func, select

from app.core.errors import ApplicationError
from app.models.member import MemberStatus, OrganizationMember
from app.models.radar import (
    AlertPriority,
    AlertStatus,
    RadarAlert,
    RadarDimension,
    RadarDocumentFact,
    RadarRuleConfig,
    RadarRun,
)
from app.models.registers import (
    Expense,
    Offer,
    PaymentStatus,
    Procedure,
    ProcedureStep,
    RecordStatus,
    Sale,
)

DEFAULTS = {
    "offer.price_missing": (RadarDimension.COMPLETENESS, AlertPriority.HIGH, {}),
    "offer.expired": (RadarDimension.FRESHNESS, AlertPriority.HIGH, {}),
    "offer.multiple_active_prices": (RadarDimension.CONSISTENCY, AlertPriority.HIGH, {}),
    "offer.document_mismatch": (
        RadarDimension.CONSISTENCY,
        AlertPriority.NORMAL,
        {"min_confidence": 0.7},
    ),
    "sale.client_missing": (
        RadarDimension.COMPLETENESS,
        AlertPriority.NORMAL,
        {"client_required": True},
    ),
    "sale.payment_method_missing": (RadarDimension.COMPLETENESS, AlertPriority.NORMAL, {}),
    "sale.payment_overdue": (
        RadarDimension.FRESHNESS,
        AlertPriority.HIGH,
        {"payment_delay_days": 30},
    ),
    "sale.amount_inconsistent": (RadarDimension.CONSISTENCY, AlertPriority.HIGH, {"tolerance": 1}),
    "sale.probable_duplicate": (
        RadarDimension.CONSISTENCY,
        AlertPriority.NORMAL,
        {"date_window_days": 1, "min_confidence": 0.75},
    ),
    "expense.payment_overdue": (
        RadarDimension.FRESHNESS,
        AlertPriority.HIGH,
        {"payment_delay_days": 30},
    ),
    "cashflow.deficit_risk": (
        RadarDimension.CONSISTENCY,
        AlertPriority.CRITICAL,
        {},
    ),
    "procedure.responsible_missing": (RadarDimension.COMPLETENESS, AlertPriority.HIGH, {}),
    "procedure.validation_missing": (
        RadarDimension.TRACEABILITY,
        AlertPriority.HIGH,
        {"draft_grace_days": 14},
    ),
    "procedure.review_overdue": (RadarDimension.FRESHNESS, AlertPriority.HIGH, {}),
    "procedure.steps_missing": (
        RadarDimension.COMPLETENESS,
        AlertPriority.HIGH,
        {"operational_departments": []},
    ),
    "procedure.responsible_inactive": (RadarDimension.CONSISTENCY, AlertPriority.HIGH, {}),
}


class RadarService:
    async def set_config(self, s, org, user, code, data):
        if code not in DEFAULTS:
            raise ApplicationError("unknown_rule", "Règle Radar inconnue", 404)
        obj = await s.scalar(
            select(RadarRuleConfig).where(
                RadarRuleConfig.organization_id == org, RadarRuleConfig.rule_code == code
            )
        )
        if obj is None:
            obj = RadarRuleConfig(organization_id=org, rule_code=code, updated_by_user_id=user)
            s.add(obj)
        obj.enabled = data.enabled
        obj.priority = data.priority
        obj.parameters = data.parameters
        obj.updated_by_user_id = user
        await s.commit()
        await s.refresh(obj)
        return obj

    async def list_configs(self, s, org):
        existing = {
            x.rule_code: x
            for x in (
                await s.scalars(
                    select(RadarRuleConfig).where(RadarRuleConfig.organization_id == org)
                )
            ).all()
        }
        for code, (_, priority, params) in DEFAULTS.items():
            if code not in existing:
                obj = RadarRuleConfig(
                    organization_id=org,
                    rule_code=code,
                    priority=priority,
                    parameters=params,
                    updated_by_user_id="system",
                )
                s.add(obj)
                existing[code] = obj
        await s.commit()
        return list(existing.values())

    async def add_fact(self, s, org, data):
        fact = RadarDocumentFact(organization_id=org, **data.model_dump())
        s.add(fact)
        await s.commit()
        await s.refresh(fact)
        return fact

    async def run(self, s, org, user):
        configs = {x.rule_code: x for x in await self.list_configs(s, org)}
        run = RadarRun(organization_id=org, triggered_by_user_id=user)
        s.add(run)
        await s.flush()
        findings = []
        offers = list(
            (
                await s.scalars(
                    select(Offer).where(Offer.organization_id == org, Offer.is_archived.is_(False))
                )
            ).all()
        )
        sales = list(
            (
                await s.scalars(
                    select(Sale).where(Sale.organization_id == org, Sale.is_archived.is_(False))
                )
            ).all()
        )
        procedures = list(
            (
                await s.scalars(
                    select(Procedure).where(
                        Procedure.organization_id == org, Procedure.is_archived.is_(False)
                    )
                )
            ).all()
        )
        expenses = list(
            (
                await s.scalars(
                    select(Expense).where(
                        Expense.organization_id == org, Expense.is_archived.is_(False)
                    )
                )
            ).all()
        )
        today = date.today()

        for o in offers:
            if o.price is None:
                findings.append(
                    self.f(
                        "offer.price_missing",
                        "offer",
                        o.id,
                        "Prix manquant",
                        "Cette offre ne possède aucun prix.",
                        "Renseigner ou valider un tarif.",
                        {"price": None},
                    )
                )
            if (
                o.expires_at
                and o.expires_at < today
                and o.status not in {RecordStatus.ARCHIVED, RecordStatus.OBSOLETE}
            ):
                findings.append(
                    self.f(
                        "offer.expired",
                        "offer",
                        o.id,
                        "Tarif expiré",
                        f"Le tarif a expiré le {o.expires_at.isoformat()}.",
                        "Mettre à jour ou archiver cette offre.",
                        {"expires_at": o.expires_at.isoformat()},
                    )
                )
        groups = {}
        for o in offers:
            if o.status == RecordStatus.VALIDATED and not o.is_archived:
                groups.setdefault(o.name.strip().lower(), []).append(o)
        for same in groups.values():
            prices = {str(x.price) for x in same if x.price is not None}
            if len(prices) > 1:
                for o in same:
                    findings.append(
                        self.f(
                            "offer.multiple_active_prices",
                            "offer",
                            o.id,
                            "Plusieurs tarifs actifs",
                            f"{len(prices)} tarifs actifs existent pour cette offre.",
                            "Conserver un seul tarif officiel.",
                            {"prices": sorted(prices)},
                        )
                    )
        facts = list(
            (
                await s.scalars(
                    select(RadarDocumentFact).where(RadarDocumentFact.organization_id == org)
                )
            ).all()
        )
        offer_by_id = {o.id: o for o in offers}
        for fact in facts:
            if (
                fact.record_type == "offer"
                and fact.field_name == "price"
                and fact.record_id in offer_by_id
                and fact.confidence
                >= float(self.params(configs, "offer.document_mismatch").get("min_confidence", 0.7))
            ):
                offer = offer_by_id[fact.record_id]
                try:
                    mismatch = offer.price is not None and Decimal(fact.value) != offer.price
                except InvalidOperation:
                    mismatch = False
                if mismatch:
                    findings.append(
                        self.f(
                            "offer.document_mismatch",
                            "offer",
                            offer.id,
                            "Prix différent dans un document",
                            f"Le registre indique {offer.price}, le document indique {fact.value}.",
                            "Comparer les sources et valider la valeur officielle.",
                            {
                                "register_value": str(offer.price),
                                "document_value": fact.value,
                                "source_attachment_id": fact.source_attachment_id,
                            },
                            fact.confidence,
                        )
                    )
        for sale in sales:
            p = self.params(configs, "sale.client_missing")
            if p.get("client_required", True) and not sale.client_name:
                findings.append(
                    self.f(
                        "sale.client_missing",
                        "sale",
                        sale.id,
                        "Client manquant",
                        "Cette vente exige un client identifié.",
                        "Renseigner le client ou désactiver cette règle pour les ventes anonymes.",
                        {},
                    )
                )
            if (
                sale.payment_status in {PaymentStatus.PAID, PaymentStatus.PARTIAL}
                and not sale.payment_method
            ):
                findings.append(
                    self.f(
                        "sale.payment_method_missing",
                        "sale",
                        sale.id,
                        "Mode de paiement manquant",
                        "La vente est payée ou partiellement payée sans mode de paiement.",
                        "Renseigner le mode de paiement.",
                        {"payment_status": sale.payment_status.value},
                    )
                )
            delay = int(self.params(configs, "sale.payment_overdue").get("payment_delay_days", 30))
            if (
                sale.payment_status == PaymentStatus.UNPAID
                and sale.sale_date + timedelta(days=delay) < today
            ):
                findings.append(
                    self.f(
                        "sale.payment_overdue",
                        "sale",
                        sale.id,
                        "Paiement en retard",
                        f"Le délai configuré de {delay} jours est dépassé.",
                        "Vérifier l'échéance et relancer le paiement.",
                        {"sale_date": sale.sale_date.isoformat(), "delay_days": delay},
                    )
                )
            expected = sale.quantity * sale.unit_price - sale.discount
            tolerance = Decimal(
                str(self.params(configs, "sale.amount_inconsistent").get("tolerance", 1))
            )
            if abs(sale.total_amount - expected) > tolerance:
                findings.append(
                    self.f(
                        "sale.amount_inconsistent",
                        "sale",
                        sale.id,
                        "Montant incohérent",
                        (
                            f"Le montant enregistré est {sale.total_amount}, "
                            f"le calcul attendu est {expected}."
                        ),
                        "Vérifier quantité, prix, remise et frais.",
                        {
                            "actual": str(sale.total_amount),
                            "expected": str(expected),
                            "tolerance": str(tolerance),
                        },
                    )
                )
        for idx, a in enumerate(sales):
            for b in sales[idx + 1 :]:
                score = 0.0
                if a.reference == b.reference:
                    score += 0.45
                if a.client_name and a.client_name == b.client_name:
                    score += 0.15
                if a.item_label == b.item_label:
                    score += 0.15
                if a.total_amount == b.total_amount:
                    score += 0.15
                if abs((a.sale_date - b.sale_date).days) <= int(
                    self.params(configs, "sale.probable_duplicate").get("date_window_days", 1)
                ):
                    score += 0.10
                threshold = float(
                    self.params(configs, "sale.probable_duplicate").get("min_confidence", 0.75)
                )
                if score >= threshold:
                    for x, y in [(a, b), (b, a)]:
                        findings.append(
                            self.f(
                                "sale.probable_duplicate",
                                "sale",
                                x.id,
                                "Doublon probable",
                                f"Cette vente ressemble à la vente {y.reference}.",
                                "Comparer les deux ventes avant toute fusion.",
                                {"other_sale_id": y.id, "score": score},
                                score,
                            )
                        )

        # ------------------ EXPENSES & CASHFLOW CHECKS ------------------
        for exp in expenses:
            delay = int(
                self.params(configs, "expense.payment_overdue").get("payment_delay_days", 30)
            )
            if (
                exp.payment_status == PaymentStatus.UNPAID
                and exp.expense_date + timedelta(days=delay) < today
            ):
                findings.append(
                    self.f(
                        "expense.payment_overdue",
                        "expense",
                        exp.id,
                        "Facture fournisseur en retard",
                        f"Le règlement de cette dépense vers {exp.beneficiary} est en retard de plus de {delay} jours.",
                        "Effectuer le règlement ou mettre à jour l'échéance.",
                        {"expense_date": exp.expense_date.isoformat(), "delay_days": delay},
                    )
                )

        total_income_paid = sum(
            (sa.total_amount for sa in sales if sa.payment_status == PaymentStatus.PAID),
            Decimal("0.00"),
        )
        total_expenses_paid = sum(
            (ex.amount for ex in expenses if ex.payment_status == PaymentStatus.PAID),
            Decimal("0.00"),
        )
        net_cash = total_income_paid - total_expenses_paid
        if net_cash < Decimal("0.00") and expenses:
            findings.append(
                self.f(
                    "cashflow.deficit_risk",
                    "cashflow",
                    expenses[0].id,
                    "Risque de trésorerie négative",
                    f"Les sorties d'argent effectives ({total_expenses_paid}) dépassent les encaissements ({total_income_paid}).",
                    "Accélérer le recouvrement des ventes impayées et maîtriser les dépenses.",
                    {"net_cash": str(net_cash)},
                )
            )

        active_members = {
            m.user_id
            for m in (
                await s.scalars(
                    select(OrganizationMember).where(
                        OrganizationMember.organization_id == org,
                        OrganizationMember.status == MemberStatus.ACTIVE,
                    )
                )
            ).all()
        }

        for proc in procedures:
            if (
                proc.status in {RecordStatus.VALIDATED, RecordStatus.TO_VERIFY}
                and not proc.responsible_user_id
            ):
                findings.append(
                    self.f(
                        "procedure.responsible_missing",
                        "procedure",
                        proc.id,
                        "Responsable manquant",
                        "Cette procédure active n'a aucun responsable.",
                        "Désigner un responsable.",
                        {},
                    )
                )
            grace = int(
                self.params(configs, "procedure.validation_missing").get("draft_grace_days", 14)
            )
            created = proc.created_at.date() if proc.created_at else today
            if (proc.status == RecordStatus.VALIDATED and not proc.validation_date) or (
                proc.status == RecordStatus.DRAFT and created + timedelta(days=grace) < today
            ):
                findings.append(
                    self.f(
                        "procedure.validation_missing",
                        "procedure",
                        proc.id,
                        "Validation manquante",
                        "La procédure n'est pas correctement validée dans le délai configuré.",
                        "Faire valider la procédure ou ajuster son statut.",
                        {"grace_days": grace},
                    )
                )
            if proc.next_review_date and proc.next_review_date < today:
                findings.append(
                    self.f(
                        "procedure.review_overdue",
                        "procedure",
                        proc.id,
                        "Révision échue",
                        f"La révision était prévue le {proc.next_review_date.isoformat()}.",
                        "Réviser et revalider la procédure.",
                        {"next_review_date": proc.next_review_date.isoformat()},
                    )
                )
            step_count = int(
                await s.scalar(
                    select(func.count())
                    .select_from(ProcedureStep)
                    .where(ProcedureStep.procedure_id == proc.id)
                )
                or 0
            )
            departments = self.params(configs, "procedure.steps_missing").get(
                "operational_departments", []
            )
            operational = not departments or proc.department in departments
            if operational and step_count == 0 and proc.status != RecordStatus.DRAFT:
                findings.append(
                    self.f(
                        "procedure.steps_missing",
                        "procedure",
                        proc.id,
                        "Étapes manquantes",
                        "Cette procédure opérationnelle ne contient aucune étape.",
                        "Ajouter les étapes dans l'ordre d'exécution.",
                        {"department": proc.department},
                    )
                )
            if proc.responsible_user_id and proc.responsible_user_id not in active_members:
                findings.append(
                    self.f(
                        "procedure.responsible_inactive",
                        "procedure",
                        proc.id,
                        "Responsable inactif",
                        "Le responsable n'est plus un membre actif.",
                        "Désigner un nouveau responsable.",
                        {"responsible_user_id": proc.responsible_user_id},
                    )
                )
        created = 0
        for finding in findings:
            cfg = configs[finding["rule_code"]]
            if not cfg.enabled:
                continue
            fp = self.fingerprint(
                finding["rule_code"],
                finding["record_type"],
                finding["record_id"],
                finding["evidence"],
            )
            alert = await s.scalar(
                select(RadarAlert).where(
                    RadarAlert.organization_id == org, RadarAlert.fingerprint == fp
                )
            )
            if alert is None:
                alert = RadarAlert(
                    organization_id=org,
                    run_id=run.id,
                    priority=cfg.priority,
                    fingerprint=fp,
                    status=AlertStatus.OPEN,
                    **finding,
                )
                s.add(alert)
                created += 1
            elif alert.status in {AlertStatus.RESOLVED, AlertStatus.IGNORED}:
                alert.status = AlertStatus.OPEN
                alert.run_id = run.id
        run.alerts_created = created
        run.scores = self.scores(findings, configs, offers, sales, procedures)
        await s.commit()
        await s.refresh(run)
        return run

    def params(self, configs, code):
        return {**DEFAULTS[code][2], **configs[code].parameters}

    def f(self, code, typ, rid, title, explanation, recommendation, evidence, confidence=1.0):
        return {
            "rule_code": code,
            "dimension": DEFAULTS[code][0],
            "record_type": typ,
            "record_id": rid,
            "title": title,
            "explanation": explanation,
            "recommendation": recommendation,
            "evidence": evidence,
            "confidence": confidence,
        }

    def fingerprint(self, code, typ, rid, evidence):
        return hashlib.sha256(f"{code}:{typ}:{rid}:{evidence}".encode()).hexdigest()

    def scores(self, findings, configs, offers, sales, procedures):
        total = max(1, len(offers) + len(sales) + len(procedures))
        counts = {d.value: 0 for d in RadarDimension}
        for f in findings:
            if configs[f["rule_code"]].enabled:
                counts[f["dimension"].value] += 1
        return {k: round(max(0, 100 - (v / total * 100)), 2) for k, v in counts.items()}

    async def alerts(self, s, org, status=None, dimension=None):
        stmt = select(RadarAlert).where(RadarAlert.organization_id == org)
        if status:
            stmt = stmt.where(RadarAlert.status == status)
        if dimension:
            stmt = stmt.where(RadarAlert.dimension == dimension)
        return list((await s.scalars(stmt.order_by(RadarAlert.created_at.desc()))).all())

    async def update_alert(self, s, org, alert_id, status):
        alert = await s.scalar(
            select(RadarAlert).where(RadarAlert.id == alert_id, RadarAlert.organization_id == org)
        )
        if not alert:
            raise ApplicationError("alert_not_found", "Alerte introuvable", 404)
        alert.status = status
        await s.commit()
        await s.refresh(alert)
        return alert
