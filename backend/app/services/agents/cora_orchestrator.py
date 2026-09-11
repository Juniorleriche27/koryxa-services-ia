# ruff: noqa: E501
from __future__ import annotations

from collections import defaultdict
from datetime import date
from decimal import Decimal
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.organization import Organization
from app.models.radar import AlertStatus, RadarAlert
from app.models.registers import Expense, Offer, PaymentStatus, Sale
from app.schemas.ai import AIChatRequest, AIChatResponse, SuggestedAction
from app.services.agents.base import BaseSpecializedAgent
from app.services.agents.domain_expertise import get_domain_expertise
from app.services.agents.finance_agent import FinanceAgent
from app.services.agents.operations_sop_agent import OperationsSOPAgent
from app.services.agents.politeness_agent import Language, PolitenessAgent, PolitenessConfig, Tone
from app.services.agents.radar_sentinel_agent import RadarSentinelAgent
from app.services.agents.sales_recovery_agent import SalesRecoveryAgent
from app.services.registers import RegisterService


class CoraOrchestrator(BaseSpecializedAgent):
    """Directrice des Opérations & Chef d'Orchestre IA Sémantique de KORYXA."""

    def __init__(self) -> None:
        super().__init__(
            name="Cora · Directrice des Opérations",
            badge="🧑‍💼 Coach Exécutif",
            role_title="Directrice des Opérations & Stratégie",
            system_prompt=(
                "Tu es Cora, la Directrice des Opérations et Copilote IA de KORYXA. "
                "Tu as une vision à 360 degrés sur toute l'entreprise (Trésorerie, Ventes, Écolages, Dépenses, Stocks, Procédures et Radar Qualité). "
                "Tu comprends le langage naturel, le contexte de la conversation, les pronoms, les questions courtes de suivi ('et mon chiffre d'affaires ?', 'et les impayés ?', 'qui doit quoi ?', 'combien j'ai en caisse ?'), les homonymes et le jargon métier de chaque secteur. "
                "Tu réponds avec intelligence, précision, bienveillance et rigueur entrepreneuriale. "
                "Règle absolue : Ne jamais utiliser de markdown brut avec des doubles astérisques (pas de **)."
            ),
        )
        self.finance_agent = FinanceAgent()
        self.sales_agent = SalesRecoveryAgent()
        self.radar_agent = RadarSentinelAgent()
        self.ops_agent = OperationsSOPAgent()
        self.registers_svc = RegisterService()
        self.politeness = PolitenessAgent(
            config=PolitenessConfig(
                tone=Tone.WARM,
                language=Language.FR,
                auto_greet=True,
                soften_no_results=True,
                sanitize_rag_queries=True,
            )
        )

    async def process(
        self,
        s: AsyncSession,
        org: str,
        user: str,
        user_message: str,
        context: dict[str, Any],
        org_name: str,
        currency: str,
        domain: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        return {
            "reply": "Cora opérationnelle.",
            "agent_name": self.name,
            "agent_badge": self.badge,
        }

    async def route_and_execute(
        self, s: AsyncSession, org_id: str, user_id: str, request: AIChatRequest
    ) -> AIChatResponse:
        # Extract last user message and format conversation history
        last_user_msg = ""
        history_lines: list[str] = []
        for m in request.messages:
            role_label = "Utilisateur" if m.role == "user" else "Cora"
            history_lines.append(f"{role_label}: {m.content.strip()}")
            if m.role == "user":
                last_user_msg = m.content.strip()

        history_str = "\n".join(history_lines[-8:])
        msg_lower = last_user_msg.lower()

        lang = getattr(request, "language", "fr") or "fr"
        lang_names = {
            "fr": "Français",
            "en": "English",
            "es": "Español",
            "pt": "Português",
            "ar": "العربية",
        }
        target_lang = lang_names.get(lang, "Français")

        # Suggested actions localized per language
        suggested_dict = {
            "fr": [
                SuggestedAction(
                    title="Ventes du jour",
                    action_type="send_chat",
                    payload={"prompt": "Donne-moi les ventes d'aujourd'hui"},
                ),
                SuggestedAction(
                    title="Situation de trésorerie",
                    action_type="send_chat",
                    payload={"prompt": "Quelle est ma trésorerie réelle et mon solde de caisse ?"},
                ),
                SuggestedAction(
                    title="Créances à relancer",
                    action_type="send_chat",
                    payload={"prompt": "Quels sont les impayés prioritaires ?"},
                ),
                SuggestedAction(
                    title="Analyse de gestion",
                    action_type="send_chat",
                    payload={"prompt": "Fais-moi une analyse complète de mes chiffres"},
                ),
            ],
            "en": [
                SuggestedAction(
                    title="Today's sales",
                    action_type="send_chat",
                    payload={"prompt": "Give me today's sales report"},
                ),
                SuggestedAction(
                    title="Cash position",
                    action_type="send_chat",
                    payload={"prompt": "What is my actual cash in hand?"},
                ),
                SuggestedAction(
                    title="Debt recovery",
                    action_type="send_chat",
                    payload={"prompt": "Which clients should I follow up with for unpaid debts?"},
                ),
            ],
            "es": [
                SuggestedAction(
                    title="Ventas del día",
                    action_type="send_chat",
                    payload={"prompt": "Dame las ventas de hoy"},
                ),
                SuggestedAction(
                    title="Situación de caja",
                    action_type="send_chat",
                    payload={"prompt": "¿Cuál es mi saldo real en caja?"},
                ),
                SuggestedAction(
                    title="Cobros pendientes",
                    action_type="send_chat",
                    payload={"prompt": "¿Cuáles son las deudas pendientes de cobro?"},
                ),
            ],
            "pt": [
                SuggestedAction(
                    title="Vendas do dia",
                    action_type="send_chat",
                    payload={"prompt": "Dá-me as vendas de hoje"},
                ),
                SuggestedAction(
                    title="Saldo de caixa",
                    action_type="send_chat",
                    payload={"prompt": "Qual é o meu saldo real em caixa?"},
                ),
                SuggestedAction(
                    title="Cobranças pendentes",
                    action_type="send_chat",
                    payload={"prompt": "Quais são as dívidas pendentes a cobrar?"},
                ),
            ],
            "ar": [
                SuggestedAction(
                    title="مبيعات اليوم",
                    action_type="send_chat",
                    payload={"prompt": "أعطني مبيعات اليوم"},
                ),
                SuggestedAction(
                    title="السيولة النقدية",
                    action_type="send_chat",
                    payload={"prompt": "ما هو الرصيد الفعلي في الصندوق؟"},
                ),
                SuggestedAction(
                    title="الديون المستحقة",
                    action_type="send_chat",
                    payload={"prompt": "ما هي الديون والعملاء الواجب تحصيل مبالغهم؟"},
                ),
            ],
        }
        current_suggested = suggested_dict.get(lang, suggested_dict["fr"])

        # Fetch basic Organization profile
        org = await s.get(Organization, org_id)
        org_name = org.name if org else "votre organisation"
        responsible = org.responsible_name if org and org.responsible_name else "Dirigeant"
        sector_category = org.business_category if org else "retail"
        domain = get_domain_expertise(sector_category)
        sector_label = domain.get("sector_label", "Entreprise")

        # 1. Direct Action Intents (e.g. "Enregistre une vente", "Enregistre une dépense")
        is_sale_action = any(
            w in msg_lower
            for w in [
                "enregistre une vente",
                "ajoute une vente",
                "crée une vente",
                "cree une vente",
                "note une vente",
                "nouvelle vente",
                "vends ",
                "vente de ",
                "vente d'",
                "enregistre l'écolage",
                "enregistre l'ecolage",
                "encaisse l'écolage",
            ]
        )

        if is_sale_action:
            currency_pref = "XOF"
            sales_action = await self.sales_agent._try_record_sale(
                s, org_id, user_id, last_user_msg, currency_pref
            )
            if sales_action:
                return AIChatResponse(
                    reply=sales_action["reply"],
                    provider_used="Knowlia Commercial Engine",
                    model_used="koryxa-sales-recovery-agent",
                    agent_name=sales_action["agent_name"],
                    agent_badge=sales_action["agent_badge"],
                    thinking_summary=sales_action.get("thinking_summary"),
                    action_executed=sales_action.get("action_executed"),
                    suggested_actions=[
                        SuggestedAction(**a) for a in sales_action.get("suggested_actions", [])
                    ],
                )

        if any(
            w in msg_lower
            for w in [
                "enregistre une dépense",
                "enregistre la dépense",
                "ajoute une dépense",
                "enregistrer dépense",
                "nouvelle dépense",
                "payé une dépense",
                "décaissement de",
                "decaissement de",
                "dépense de ",
                "depense de ",
            ]
        ):
            currency_pref = "XOF"
            expense_action = await self.finance_agent._try_record_expense(
                s, org_id, user_id, last_user_msg, currency_pref
            )
            if expense_action:
                return AIChatResponse(
                    reply=expense_action["reply"],
                    provider_used="Knowlia Financial Engine",
                    model_used="koryxa-finance-agent",
                    agent_name=expense_action["agent_name"],
                    agent_badge=expense_action["agent_badge"],
                    thinking_summary=expense_action.get("thinking_summary"),
                    action_executed=expense_action.get("action_executed"),
                    suggested_actions=[
                        SuggestedAction(**a) for a in expense_action.get("suggested_actions", [])
                    ],
                )

        # 2. Pure Greeting Bypass (Only if exact greeting with no business question)
        triage = self.politeness.triage(last_user_msg)
        is_question = (
            "?" in last_user_msg
            or any(
                w in msg_lower
                for w in [
                    "donne",
                    "combien",
                    "quel",
                    "quelle",
                    "quels",
                    "quelles",
                    "qui",
                    "où",
                    "ou",
                    "comment",
                    "pourquoi",
                    "montre",
                    "affiche",
                    "analyse",
                    "fais",
                    "bilan",
                    "point",
                    "situation",
                    "voir",
                    "liste",
                    "état",
                    "etat",
                    "stat",
                    "stats",
                    "chiffre",
                    "vente",
                    "caisse",
                    "argent",
                    "solde",
                    "impaye",
                    "impayé",
                    "créance",
                    "creance",
                    "dépense",
                    "depense",
                    "stock",
                    "radar",
                ]
            )
        )

        if not triage.is_rag_query and not is_question and len(msg_lower.split()) <= 3:
            if lang == "en":
                polite_reply = f"Hello {responsible}! Great to assist you at the helm of {org_name} ({sector_label}).\n\nHow can I help you today? I can analyze your figures, record live transactions, check your cash position, or guide your daily executive decisions."
            elif lang == "es":
                polite_reply = f"¡Hola {responsible}! Un placer acompañarle en la gestión de {org_name} ({sector_label}).\n\n¿En qué puedo orientarle hoy? Puedo analizar sus cifras, registrar ventas o gastos en directo, o asesorarle en sus decisiones del día."
            elif lang == "pt":
                polite_reply = f"Olá {responsible}! É um prazer estar ao seu lado na liderança de {org_name} ({sector_label}).\n\nComo posso ajudar hoje? Posso analisar os seus números, registar operações em tempo real ou aconselhar as suas decisões diárias."
            elif lang == "ar":
                polite_reply = f"مرحباً بك {responsible}! يسعدني مرافقتك في قيادة وإدارة مؤسسة {org_name} ({sector_label}).\n\nكيف يمكنني مساعدتك اليوم؟ يمكنني تحليل الأرقام والسيولة، تسجيل العمليات فورياً أو تقديم استشارات داعمة لقراراتك اليومية."
            else:
                polite_reply = f"Bonjour {responsible} ! C'est un plaisir de vous retrouver au pilotage de {org_name} ({sector_label}).\n\nComment puis-je vous aider aujourd'hui ? Je peux analyser vos chiffres, enregistrer une opération en direct ou vous conseiller sur vos décisions du jour."
            return AIChatResponse(
                reply=polite_reply,
                provider_used="Politeness Gateway",
                model_used="koryxa-politeness-agent",
                agent_name="Cora · Directrice des Opérations"
                if lang == "fr"
                else f"Cora · Operations AI ({target_lang})",
                agent_badge="🧑‍💼 Coach Exécutif",
                thinking_summary="Accueil courtois exécutif",
                action_executed=None,
                suggested_actions=current_suggested,
            )

        # 3. Deep Live Database Querying & Aggregation
        today = date.today()

        # Sales records
        sales_stmt = (
            select(Sale)
            .where(Sale.organization_id == org_id, Sale.is_archived.is_(False))
            .order_by(Sale.sale_date.desc(), Sale.created_at.desc())
        )
        all_sales = list((await s.scalars(sales_stmt)).all())

        total_sales_count = len(all_sales)
        total_sales_amount = Decimal("0.00")
        total_sales_paid = Decimal("0.00")
        total_sales_unpaid = Decimal("0.00")
        currency = "XOF"

        today_sales: list[Sale] = []
        today_sales_amount = Decimal("0.00")
        today_sales_paid = Decimal("0.00")
        today_sales_unpaid = Decimal("0.00")

        unpaid_sales: list[Sale] = []
        client_sales_map: dict[str, Decimal] = defaultdict(Decimal)

        for sale in all_sales:
            currency = sale.currency or currency
            amt = sale.total_amount if sale.total_amount is not None else Decimal("0.00")
            p_amt = sale.paid_amount if sale.paid_amount is not None else Decimal("0.00")
            total_sales_amount += amt

            status_str = (
                sale.payment_status.value
                if hasattr(sale.payment_status, "value")
                else str(sale.payment_status).lower()
            )
            if status_str == "paid":
                actual_paid = amt if p_amt == Decimal("0.00") else p_amt
                total_sales_paid += actual_paid
            elif status_str == "partial":
                total_sales_paid += p_amt
                unpaid_part = max(Decimal("0.00"), amt - p_amt)
                total_sales_unpaid += unpaid_part
                unpaid_sales.append(sale)
            else:  # unpaid
                total_sales_unpaid += amt
                unpaid_sales.append(sale)

            client_name = sale.client_name or "Client anonyme"
            client_sales_map[client_name] += amt

            if sale.sale_date == today:
                today_sales.append(sale)
                today_sales_amount += amt
                if status_str == "paid":
                    today_sales_paid += amt if p_amt == Decimal("0.00") else p_amt
                elif status_str == "partial":
                    today_sales_paid += p_amt
                    today_sales_unpaid += max(Decimal("0.00"), amt - p_amt)
                else:
                    today_sales_unpaid += amt

        # Strict consistency: Total Unpaid = Total Sales - Total Paid
        total_sales_unpaid = max(Decimal("0.00"), total_sales_amount - total_sales_paid)
        recouvrement_rate = (
            round(float(total_sales_paid / total_sales_amount) * 100)
            if total_sales_amount > 0
            else 100
        )

        # Expenses records
        expenses_stmt = (
            select(Expense)
            .where(Expense.organization_id == org_id, Expense.is_archived.is_(False))
            .order_by(Expense.expense_date.desc(), Expense.created_at.desc())
        )
        all_expenses = list((await s.scalars(expenses_stmt)).all())

        total_expenses_paid = Decimal("0.00")
        total_expenses_unpaid = Decimal("0.00")
        today_expenses_amount = Decimal("0.00")

        for exp in all_expenses:
            e_amt = exp.amount if exp.amount is not None else Decimal("0.00")
            if exp.payment_status == "paid":
                total_expenses_paid += e_amt
            else:
                total_expenses_unpaid += e_amt
            if exp.expense_date == today:
                today_expenses_amount += e_amt

        net_cash = total_sales_paid - total_expenses_paid

        # Stock / Offers records
        offers_stmt = select(Offer).where(
            Offer.organization_id == org_id, Offer.is_archived.is_(False)
        )
        all_offers = list((await s.scalars(offers_stmt)).all())
        low_stock_items = []
        total_stock_val = Decimal("0.00")

        for off in all_offers:
            if off.track_stock:
                qty = off.stock_quantity if off.stock_quantity is not None else Decimal("0.00")
                unit_val = (
                    off.cost_price
                    if off.cost_price is not None
                    else (off.price if off.price is not None else Decimal("0.00"))
                )
                total_stock_val += qty * unit_val
                min_threshold = (
                    off.min_stock_alert if off.min_stock_alert is not None else Decimal("5.00")
                )
                if qty <= min_threshold:
                    low_stock_items.append(f"{off.name} (Reste: {qty:g}, Seuil: {min_threshold:g})")

        # Open Radar Alerts
        alerts_stmt = (
            select(RadarAlert)
            .where(RadarAlert.organization_id == org_id, RadarAlert.status == AlertStatus.OPEN)
            .order_by(RadarAlert.priority.desc())
            .limit(10)
        )
        open_alerts = list((await s.scalars(alerts_stmt)).all())

        # Top clients ranking
        top_clients_ranked = sorted(client_sales_map.items(), key=lambda x: x[1], reverse=True)[:5]

        # 4. Intent Detection
        is_today_sales_query = any(
            phrase in msg_lower
            for phrase in [
                "vente du jour",
                "ventes du jour",
                "vente d'aujourd'hui",
                "ventes d'aujourd'hui",
                "vente aujourd'hui",
                "ventes aujourd'hui",
                "recette du jour",
                "chiffre du jour",
                "aujourd'hui",
                "ce jour",
                "bilan du jour",
                "combien on a vendu aujourd'hui",
                "combien j'ai vendu aujourd'hui",
                "point du jour",
            ]
        )

        is_global_sales_query = any(
            phrase in msg_lower
            for phrase in [
                "chiffre d'affaire",
                "chiffre daffaire",
                "mon ca",
                "notre ca",
                "total des ventes",
                "total vente",
                "total des recettes",
                "combien on a vendu",
                "combien j'ai vendu",
                "point sur les ventes",
                "point des ventes",
                "bilan des ventes",
                "statistiques de vente",
                "mes ventes",
                "nos ventes",
                "analyse des ventes",
                "historique des ventes",
                "ventes",
                "facturation",
                "turnover",
                "revenue",
            ]
        )

        is_cash_query = any(
            phrase in msg_lower
            for phrase in [
                "trésorerie",
                "tresorerie",
                "solde de caisse",
                "solde en caisse",
                "en caisse",
                "argent disponible",
                "caisse disponible",
                "point de trésorerie",
                "point de tresorerie",
                "situation de caisse",
                "combien j'ai en caisse",
                "combien on a en caisse",
                "combien d'argent",
                "mon solde",
                "notre solde",
                "liquidités",
                "liquidite",
                "cash",
                "disponible en caisse",
            ]
        )

        is_debt_query = any(
            phrase in msg_lower
            for phrase in [
                "impayé",
                "impaye",
                "impayés",
                "impayees",
                "créance",
                "creance",
                "créances",
                "creances",
                "qui me doit",
                "qui nous doit",
                "qui doit",
                "relance",
                "relances",
                "relancer",
                "dette client",
                "dettes clients",
                "facture en retard",
                "factures impayées",
                "recouvrement",
            ]
        )

        is_expense_query = any(
            phrase in msg_lower
            for phrase in [
                "dépense",
                "depense",
                "dépenses",
                "depenses",
                "mes charges",
                "nos charges",
                "frais",
                "décaissement",
                "decaissement",
                "combien on a dépensé",
                "combien j'ai dépensé",
                "achats",
            ]
        )

        is_top_clients_query = any(
            phrase in msg_lower
            for phrase in [
                "meilleur client",
                "meilleurs clients",
                "top client",
                "top clients",
                "gros client",
                "gros clients",
                "qui achète le plus",
                "qui a le plus acheté",
                "fidélité",
                "principaux clients",
            ]
        )

        is_stock_query = any(
            phrase in msg_lower
            for phrase in [
                "stock",
                "stocks",
                "produit",
                "produits",
                "article",
                "articles",
                "rupture",
                "alerte stock",
                "inventaire",
            ]
        )

        is_radar_query = any(
            phrase in msg_lower
            for phrase in [
                "radar",
                "conformité",
                "qualité",
                "audit",
                "anomalie",
                "anomalies",
                "risque",
                "risques",
                "sentinelle",
            ]
        )

        is_general_analysis_query = any(
            phrase in msg_lower
            for phrase in [
                "analyse",
                "analyse mes chiffres",
                "analyse les chiffres",
                "diagnostic",
                "bilan",
                "comment va",
                "conseil",
                "conseils",
                "stratégie",
                "strategie",
                "santé",
                "sante",
                "performance",
                "optimiser",
                "point général",
                "résumé",
                "synthese",
                "synthèse",
                "avis",
                "briefing",
            ]
        )

        # 5. Specialized Native Analyzers

        # A) VENTES DU JOUR
        if is_today_sales_query:
            today_str = today.strftime("%d/%m/%Y")
            if today_sales:
                sales_lines = []
                for s_item in today_sales[:8]:
                    client_lbl = s_item.client_name or "Client anonyme"
                    item_lbl = s_item.item_label or s_item.reference
                    st_txt = (
                        "Encaissé"
                        if s_item.payment_status in (PaymentStatus.PAID, "paid")
                        else (
                            "Acompte reçu"
                            if s_item.payment_status in (PaymentStatus.PARTIAL, "partial")
                            else "Non payé"
                        )
                    )
                    sales_lines.append(
                        f"• {client_lbl} ({item_lbl}) : {float(s_item.total_amount):,.0f} {currency} — [{st_txt}]"
                    )
                details_block = "\n".join(sales_lines).replace(",", " ")

                reply = (
                    f"📅 Point des Ventes du Jour ({today_str}) pour {org_name} :\n\n"
                    f"• 💰 Total des Ventes du Jour : {float(today_sales_amount):,.0f} {currency} ({len(today_sales)} opération(s))\n"
                    f"• 📥 Réellement Encaissé : {float(today_sales_paid):,.0f} {currency}\n"
                    f"• ⏳ Créances du Jour en Attente : {float(today_sales_unpaid):,.0f} {currency}\n\n"
                    f"Détail des opérations enregistrées aujourd'hui :\n"
                    f"{details_block}\n\n"
                    f"💡 Recommandation : "
                    + (
                        "Pensez à relancer les créances du jour dès demain matin."
                        if today_sales_unpaid > 0
                        else "Excellente gestion : 100% des ventes du jour ont été encaissées !"
                    )
                ).replace(",", " ")
            else:
                last_sale_note = ""
                if all_sales:
                    latest = all_sales[0]
                    last_sale_note = f"\n💡 Dernière vente enregistrée : le {latest.sale_date} ({latest.client_name or 'Client'} — {float(latest.total_amount):,.0f} {currency}).".replace(
                        ",", " "
                    )

                reply = (
                    f"📅 Point des Ventes du Jour ({today_str}) pour {org_name} :\n\n"
                    f"• ℹ️ Aucune vente n'a encore été enregistrée aujourd'hui ({today_str}).\n"
                    f"• 💰 Chiffre d'Affaires du jour : 0 {currency}{last_sale_note}\n\n"
                    f"👉 Pour saisir une vente en direct, utilisez le micro de dictée vocale ou le bouton « Nouvelle vente »."
                )

            return AIChatResponse(
                reply=reply,
                provider_used="Financial Register Core (Temps Réel)",
                model_used="koryxa-cora-analytics",
                agent_name="Cora · Directrice des Opérations",
                agent_badge="🧑‍💼 Coach Exécutif",
                thinking_summary=f"Calcul en temps réel des ventes du jour ({today_str}) pour {org_name}",
                action_executed=None,
                suggested_actions=[
                    SuggestedAction(
                        title="Situation de trésorerie",
                        action_type="send_chat",
                        payload={"prompt": "Quelle est ma trésorerie réelle en caisse ?"},
                    ),
                    SuggestedAction(
                        title="Créances à relancer",
                        action_type="send_chat",
                        payload={"prompt": "Quels sont les impayés prioritaires ?"},
                    ),
                ],
            )

        # B) CHIFFRE D'AFFAIRES GLOBAL & SYNTHÈSE DES VENTES
        if is_global_sales_query:
            avg_ticket = (
                float(total_sales_amount / total_sales_count)
                if total_sales_count > 0
                else 0.0
            )
            recent_sales_lines = []
            for r_item in all_sales[:5]:
                cl = r_item.client_name or "Client anonyme"
                st = (
                    "Payé"
                    if r_item.payment_status in (PaymentStatus.PAID, "paid")
                    else (
                        "Acompte"
                        if r_item.payment_status in (PaymentStatus.PARTIAL, "partial")
                        else "Non réglé"
                    )
                )
                recent_sales_lines.append(
                    f"• {r_item.sale_date} : {cl} — {float(r_item.total_amount):,.0f} {currency} [{st}]"
                )
            recent_sales_block = "\n".join(recent_sales_lines).replace(",", " ")

            reply = (
                f"📈 Synthèse Commerciale Globale pour {org_name} :\n\n"
                f"• 💰 Chiffre d'Affaires Total Facturé : {float(total_sales_amount):,.0f} {currency} ({total_sales_count} opérations)\n"
                f"• 📥 CA Réellement Encaissé : {float(total_sales_paid):,.0f} {currency} (Taux de recouvrement : {recouvrement_rate}%)\n"
                f"• ⏳ Créances Clients à Recouvrer : {float(total_sales_unpaid):,.0f} {currency}\n"
                f"• 🎯 Panier Moyen par Vente : {avg_ticket:,.0f} {currency}\n\n"
                f"Dernières transactions enregistrées :\n"
                f"{recent_sales_block}\n\n"
                f"💡 Recommandation Commerciale : "
                + (
                    f"Concentrez vos efforts sur le recouvrement des {float(total_sales_unpaid):,.0f} {currency} en attente pour convertir 100% de votre chiffre d'affaires en trésorerie nette."
                    if total_sales_unpaid > 0
                    else "Votre performance est excellente avec un taux de recouvrement de 100% !"
                )
            ).replace(",", " ")

            return AIChatResponse(
                reply=reply,
                provider_used="Financial Register Core (Temps Réel)",
                model_used="koryxa-cora-analytics",
                agent_name="Cora · Directrice des Opérations",
                agent_badge="🧑‍💼 Coach Exécutif",
                thinking_summary=f"Synthèse complète du chiffre d'affaires pour {org_name}",
                action_executed=None,
                suggested_actions=[
                    SuggestedAction(
                        title="Ventes du jour",
                        action_type="send_chat",
                        payload={"prompt": "Donne-moi les ventes d'aujourd'hui"},
                    ),
                    SuggestedAction(
                        title="Situation de trésorerie",
                        action_type="send_chat",
                        payload={"prompt": "Quelle est ma trésorerie réelle en caisse ?"},
                    ),
                    SuggestedAction(
                        title="Créances à relancer",
                        action_type="send_chat",
                        payload={"prompt": "Quels sont les impayés prioritaires ?"},
                    ),
                ],
            )

        # C) CRÉANCES & RELANCES CLIENTS
        if is_debt_query:
            if unpaid_sales:
                unpaid_lines = []
                for u in unpaid_sales[:7]:
                    balance_due = float(u.total_amount) - float(u.paid_amount)
                    unpaid_lines.append(
                        f"• {u.client_name or 'Client anonyme'} : {balance_due:,.0f} {currency} (Réf: {u.reference}, Facturé le {u.sale_date})"
                    )
                unpaid_block = "\n".join(unpaid_lines).replace(",", " ")

                reply = (
                    f"⏳ Analyse des Créances & Impayés ({org_name}) :\n\n"
                    f"• ⚠️ Montant Total en Attente de Recouvrement : {float(total_sales_unpaid):,.0f} {currency}\n"
                    f"• 📊 Taux de Recouvrement Global : {recouvrement_rate}%\n"
                    f"• 📋 Nombre de Factures Débitrices : {len(unpaid_sales)} créance(s)\n\n"
                    f"Clients et factures prioritaires à relancer :\n"
                    f"{unpaid_block}\n\n"
                    f"💡 Plan d'action : En relançant ces {len(unpaid_sales)} clients via WhatsApp ou Email, vous renflouerez immédiatement votre solde de caisse de {float(total_sales_unpaid):,.0f} {currency}."
                ).replace(",", " ")
            else:
                reply = (
                    f"✅ Situation des Créances ({org_name}) :\n\n"
                    f"• 💰 Total Impayés : 0 {currency}\n"
                    f"• 🎯 Taux de Recouvrement : 100%\n\n"
                    f"Félicitations ! Tous vos clients sont parfaitement à jour de leurs paiements."
                )

            return AIChatResponse(
                reply=reply,
                provider_used="Sales Recovery Sentinel",
                model_used="koryxa-sales-recovery-agent",
                agent_name="Cora · Directrice des Opérations",
                agent_badge="🧑‍💼 Coach Exécutif",
                thinking_summary=f"Analyse certifiée des créances pour {org_name}",
                action_executed=None,
                suggested_actions=[
                    SuggestedAction(
                        title="Situation de trésorerie",
                        action_type="send_chat",
                        payload={"prompt": "Quelle est ma trésorerie réelle ?"},
                    ),
                    SuggestedAction(
                        title="Ventes du jour",
                        action_type="send_chat",
                        payload={"prompt": "Donne-moi les ventes d'aujourd'hui"},
                    ),
                ],
            )

        # C) TRÉSORERIE & CAISSE
        if is_cash_query:
            if net_cash > 0:
                health_eval = "🟢 Trésorerie Saine & Excédentaire"
                advice = "Vos liquidités couvrent vos décaissements. Pour consolider vos réserves, accélérez le recouvrement des créances en attente."
            elif net_cash == 0:
                health_eval = "🟡 Trésorerie à l'Équilibre"
                advice = "Vos entrées couvrent tout juste vos sorties. Évitez les dépenses non prioritaires et relancez vos clients débiteurs."
            else:
                health_eval = "🔴 Trésorerie sous Tension (Déficit opérationnel)"
                advice = "Vos décaissements dépassent vos encaissements effectifs. Priorité absolue : recouvrer les créances pour renflouer la caisse."

            reply = (
                f"💵 Diagnostic de Trésorerie & Solde de Caisse ({org_name}) :\n\n"
                f"• 🏦 Solde Net Disponible en Caisse : {float(net_cash):,.0f} {currency} ({health_eval})\n"
                f"• 📥 Total Encaissé (Ventes) : {float(total_sales_paid):,.0f} {currency}\n"
                f"• 📤 Total Décaissements (Dépenses réglées) : {float(total_expenses_paid):,.0f} {currency}\n"
                f"• ⏳ Créances clients à recouvrer : {float(total_sales_unpaid):,.0f} {currency}\n"
                f"• 📌 Dettes fournisseurs à régler : {float(total_expenses_unpaid):,.0f} {currency}\n\n"
                f"💡 Conseil de Gestion : {advice}"
            ).replace(",", " ")

            return AIChatResponse(
                reply=reply,
                provider_used="Financial Register Core",
                model_used="koryxa-finance-agent",
                agent_name="Cora · Directrice des Opérations",
                agent_badge="🧑‍💼 Coach Exécutif",
                thinking_summary=f"Calcul en temps réel de la trésorerie pour {org_name}",
                action_executed=None,
                suggested_actions=[
                    SuggestedAction(
                        title="Créances à relancer",
                        action_type="send_chat",
                        payload={"prompt": "Quels sont les impayés prioritaires ?"},
                    ),
                    SuggestedAction(
                        title="Ventes du jour",
                        action_type="send_chat",
                        payload={"prompt": "Donne-moi les ventes d'aujourd'hui"},
                    ),
                ],
            )

        # D) TOP CLIENTS / ANALYSE CLIENTS
        if is_top_clients_query:
            if top_clients_ranked:
                client_lines = []
                for idx, (c_name, c_amt) in enumerate(top_clients_ranked, 1):
                    client_lines.append(
                        f"{idx}. {c_name} : {float(c_amt):,.0f} {currency}"
                    )
                client_block = "\n".join(client_lines).replace(",", " ")

                reply = (
                    f"🏆 Palmarès des Meilleurs Clients pour {org_name} :\n\n"
                    f"Voici vos principaux clients classés par volume d'affaires total généré :\n\n"
                    f"{client_block}\n\n"
                    f"💡 Recommandation Stratégique : Ces {len(top_clients_ranked)} clients constituent le moteur de votre chiffre d'affaires. Soignez leur relation et proposez-leur des offres fidélité pour pérenniser vos revenus."
                )
            else:
                reply = "ℹ️ Vous n'avez pas encore suffisamment de transactions pour établir un classement client représentatif."

            return AIChatResponse(
                reply=reply,
                provider_used="Commercial Analytics Engine",
                model_used="koryxa-cora-analytics",
                agent_name="Cora · Directrice des Opérations",
                agent_badge="🧑‍💼 Coach Exécutif",
                thinking_summary=f"Classement des meilleurs clients pour {org_name}",
                action_executed=None,
                suggested_actions=[
                    SuggestedAction(
                        title="Chiffre d'affaires global",
                        action_type="send_chat",
                        payload={"prompt": "Quel est mon chiffre d'affaires global ?"},
                    ),
                ],
            )

        # E) DÉPENSES & CHARGES
        if is_expense_query:
            reply = (
                f"💸 Synthèse des Charges & Décaissements ({org_name}) :\n\n"
                f"• 📤 Total Dépenses Payées : {float(total_expenses_paid):,.0f} {currency}\n"
                f"• 📌 Dépenses Engagées en Attente : {float(total_expenses_unpaid):,.0f} {currency}\n"
                f"• 📊 Poids sur les Encaissements : "
                + (
                    f"{round(float(total_expenses_paid / total_sales_paid) * 100)}% des recettes"
                    if total_sales_paid > 0
                    else "Non calculable"
                )
                + "\n\n"
                "💡 Recommandation : Surveillez votre ratio de charges opérationnelles pour préserver votre marge nette."
            ).replace(",", " ")

            return AIChatResponse(
                reply=reply,
                provider_used="Financial Register Core",
                model_used="koryxa-finance-agent",
                agent_name="Cora · Directrice des Opérations",
                agent_badge="🧑‍💼 Coach Exécutif",
                thinking_summary=f"Synthèse des charges pour {org_name}",
                action_executed=None,
                suggested_actions=[
                    SuggestedAction(
                        title="Situation de trésorerie",
                        action_type="send_chat",
                        payload={"prompt": "Quelle est ma trésorerie réelle ?"},
                    ),
                ],
            )

        # F) STOCKS & ARTICLES
        if is_stock_query:
            low_stock_block = (
                "\n".join([f"• ⚠️ {it}" for it in low_stock_items[:6]])
                if low_stock_items
                else "✅ Tous vos articles sont au-dessus de leur seuil minimal de sécurité."
            )
            reply = (
                f"📦 État des Stocks & Produits ({org_name}) :\n\n"
                f"• 💰 Valeur Totale du Stock Estimée : {float(total_stock_val):,.0f} {currency}\n"
                f"• 📋 Nombre de Références Suivies : {len(all_offers)} produit(s)\n"
                f"• 🚨 Articles en Alerte de Réapprovisionnement : {len(low_stock_items)}\n\n"
                f"Détail des alertes stock :\n{low_stock_block}\n\n"
                f"💡 Conseil : Anticipez les commandes fournisseurs sur les articles en alerte pour éviter toute rupture de vente."
            ).replace(",", " ")

            return AIChatResponse(
                reply=reply,
                provider_used="Stock Operations Sentinel",
                model_used="koryxa-ops-agent",
                agent_name="Cora · Directrice des Opérations",
                agent_badge="🧑‍💼 Coach Exécutif",
                thinking_summary=f"Audit des stocks pour {org_name}",
                action_executed=None,
                suggested_actions=[
                    SuggestedAction(
                        title="Ventes du jour",
                        action_type="send_chat",
                        payload={"prompt": "Donne-moi les ventes d'aujourd'hui"},
                    ),
                ],
            )

        # G) RADAR & CONFORMITÉ
        if is_radar_query:
            if open_alerts:
                alert_lines = [
                    f"• 🔴 {a.title} : {a.explanation or 'Point de vigilance'}"
                    for a in open_alerts[:5]
                ]
                alert_block = "\n".join(alert_lines)
                reply = (
                    f"🛡️ Audit Radar & Sentinelle Qualité ({org_name}) :\n\n"
                    f"• 🚨 Alertes Actives à Traiter : {len(open_alerts)} point(s) d'attention\n\n"
                    f"{alert_block}\n\n"
                    f"💡 Recommandation : Traitez ces alertes dans l'onglet Radar pour maintenir un score opérationnel optimal de 100/100."
                )
            else:
                reply = (
                    f"🛡️ Audit Radar & Sentinelle Qualité ({org_name}) :\n\n"
                    f"• 🟢 Score Radar : 100 / 100\n"
                    f"• ✅ Aucune anomalie ni conflit détecté dans vos registres.\n\n"
                    f"Votre mémoire opérationnelle est saine et rigoureusement synchronisée."
                )

            return AIChatResponse(
                reply=reply,
                provider_used="Radar Sentinel Core",
                model_used="koryxa-radar-agent",
                agent_name="Cora · Directrice des Opérations",
                agent_badge="🧑‍💼 Coach Exécutif",
                thinking_summary=f"Audit de conformité pour {org_name}",
                action_executed=None,
                suggested_actions=[
                    SuggestedAction(
                        title="Ventes du jour",
                        action_type="send_chat",
                        payload={"prompt": "Donne-moi les ventes d'aujourd'hui"},
                    ),
                ],
            )

        # H) GLOBAL REVENUE OR COMPREHENSIVE BUSINESS DIAGNOSTIC (Default fallback for all business inquiries)
        # If Knowlia LLM is configured and operational, let it answer with full context
        semantic_prompt = (
            f"Tu es Cora, la Directrice des Opérations et Copilote IA de l'organisation : {org_name} ({sector_label}).\n"
            f"Interlocuteur : {responsible}\n"
            f"Devise principale : {currency}\n"
            f"LANGUE OBLIGATOIRE : Tu DOIS répondre en {target_lang} ({lang}).\n\n"
            f"Données comptables réelles certifiées de la base de données :\n"
            f"• Ventes du jour ({today}) : {float(today_sales_amount):,.0f} {currency} ({len(today_sales)} ventes)\n"
            f"• Total Chiffre d'Affaires Facturé : {float(total_sales_amount):,.0f} {currency} ({total_sales_count} opérations)\n"
            f"• Chiffre d'Affaires Réellement Encaissé : {float(total_sales_paid):,.0f} {currency} (Taux de recouvrement : {recouvrement_rate}%)\n"
            f"• Créances / Impayés Clients à Recouvrer : {float(total_sales_unpaid):,.0f} {currency} ({len(unpaid_sales)} clients débiteurs)\n"
            f"• Dépenses Réglées : {float(total_expenses_paid):,.0f} {currency} | Dépenses en attente : {float(total_expenses_unpaid):,.0f} {currency}\n"
            f"• Solde Réel en Caisse Disponible : {float(net_cash):,.0f} {currency}\n"
            f"• Alertes Stock : {len(low_stock_items)} articles | Alertes Radar : {len(open_alerts)}\n\n"
            f"Historique de conversation récente :\n"
            f"{history_str}\n\n"
            f"Demande de l'utilisateur : {last_user_msg}\n\n"
            f"Consigne : Réponds en tant que directrice des opérations experte et bienveillante avec des chiffres exacts et des conseils stratégiques actionnables. Pas de markdown brut **."
        )

        llm_reply = await self.call_knowlia_llm(s, org_id, user_id, semantic_prompt)
        if llm_reply and len(llm_reply) > 40 and "n'ai malheureusement pas trouvé" not in llm_reply:
            return AIChatResponse(
                reply=llm_reply,
                provider_used="Knowlia Intelligence Core",
                model_used="koryxa-cora-orchestrator",
                agent_name="Cora · Directrice des Opérations"
                if lang == "fr"
                else f"Cora · Operations AI ({target_lang})",
                agent_badge="🧑‍💼 Coach Exécutif",
                thinking_summary=f"Analyse décisionnelle ({target_lang}) pour {org_name}",
                action_executed=None,
                suggested_actions=current_suggested,
            )

        # Full Native Executive Diagnostic when LLM is offline/fallback
        if net_cash > 0:
            cash_str = f"🟢 Excédentaire (+{float(net_cash):,.0f} {currency})"
        elif net_cash == 0:
            cash_str = f"🟡 À l'Équilibre (0 {currency})"
        else:
            cash_str = f"🔴 Sous Tension ({float(net_cash):,.0f} {currency})"

        diag_title = (
            "📊 Analyse Approfondie & Diagnostic de Gestion"
            if is_general_analysis_query
            else "📊 Diagnostic Exécutif & Tableau de Bord"
        )
        diagnostic_reply = (
            f"{diag_title} ({org_name}) :\n\n"
            f"1. 📈 Performance Commerciale :\n"
            f"• Chiffre d'Affaires Total Facturé : {float(total_sales_amount):,.0f} {currency} ({total_sales_count} opérations)\n"
            f"• CA Réellement Encaissé : {float(total_sales_paid):,.0f} {currency} (Taux de recouvrement : {recouvrement_rate}%)\n"
            f"• Créances Clients en Attente : {float(total_sales_unpaid):,.0f} {currency} ({len(unpaid_sales)} factures)\n\n"
            f"2. 🏦 Trésorerie & Décaissements :\n"
            f"• Solde Réel en Caisse : {float(net_cash):,.0f} {currency} ({cash_str})\n"
            f"• Total Dépenses Réglées : {float(total_expenses_paid):,.0f} {currency}\n\n"
            f"3. 🛡️ Sentinelle & Alertes Métier :\n"
            f"• Ventes du jour ({today.strftime('%d/%m/%Y')}) : {float(today_sales_amount):,.0f} {currency} ({len(today_sales)} vente(s))\n"
            f"• Alertes Stock : {len(low_stock_items)} article(s) à réapprovisionner\n"
            f"• Alertes Radar : {len(open_alerts)} anomalie(s) ouverte(s)\n\n"
            f"💡 Recommandations Prioritaires de la Direction des Opérations :\n"
            + (
                f"1. Lancez une campagne de relance sur les {len(unpaid_sales)} créances ({float(total_sales_unpaid):,.0f} {currency}) pour renflouer votre trésorerie.\n"
                if total_sales_unpaid > 0
                else "1. Vos créances sont à 100% recouvrées, continuez sur ce rythme !\n"
            )
            + (
                f"2. Réapprovisionnez les {len(low_stock_items)} article(s) en alerte pour sécuriser vos prochaines ventes.\n"
                if low_stock_items
                else "2. Vos stocks sont équilibrés sans risque de rupture immédiat.\n"
            )
            + "3. Enregistrez chaque opération au fil de l'eau pour maintenir des statistiques infalsifiables."
        ).replace(",", " ")

        return AIChatResponse(
            reply=diagnostic_reply,
            provider_used="Cora Intelligence Executive (Temps Réel)",
            model_used="koryxa-cora-orchestrator",
            agent_name="Cora · Directrice des Opérations"
            if lang == "fr"
            else f"Cora · Operations AI ({target_lang})",
            agent_badge="🧑‍💼 Coach Exécutif",
            thinking_summary=f"Diagnostic exécutif complet certifié pour {org_name}",
            action_executed=None,
            suggested_actions=current_suggested,
        )
