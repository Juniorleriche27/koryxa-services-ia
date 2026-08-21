# ruff: noqa: E501
from __future__ import annotations

from typing import Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.organization import Organization
from app.schemas.ai import AIChatRequest, AIChatResponse, SuggestedAction
from app.services.agents.base import BaseSpecializedAgent
from app.services.agents.domain_expertise import get_domain_expertise
from app.services.agents.finance_agent import FinanceAgent
from app.services.agents.operations_sop_agent import OperationsSOPAgent
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
        # Implementation of abstract method required by BaseSpecializedAgent
        return {
            "reply": "Cora opérationnelle.",
            "agent_name": self.name,
            "agent_badge": self.badge,
        }

    async def route_and_execute(
        self, s: AsyncSession, org_id: str, user_id: str, request: AIChatRequest
    ) -> AIChatResponse:
        org = await s.get(Organization, org_id)
        org_name = org.name if org else "votre organisation"
        responsible = org.responsible_name if org and org.responsible_name else "Dirigeant"
        sector_category = org.business_category if org else "retail"
        domain = get_domain_expertise(sector_category)
        sector_label = domain.get("sector_label", "Entreprise")

        # 1. Fetch Real-time Accounting & Operational Snapshot
        summary = await self.registers_svc.get_summary(s, org_id)
        currency = summary.get("primary_currency", "XOF")

        total_sales_amount = float(summary.get("total_sales_amount", 0))
        total_sales_paid = float(summary.get("total_paid_amount", 0))
        total_sales_unpaid = float(summary.get("total_unpaid_amount", 0))
        total_expenses_paid = float(summary.get("total_expenses_paid", 0))
        net_cash = total_sales_paid - total_expenses_paid
        low_stock_count = int(summary.get("low_stock_count", 0))
        procedures_count = int(summary.get("procedures_count", 0))
        total_sales_count = int(summary.get("total_sales_count", 0))

        recouvrement_rate = (
            round((total_sales_paid / total_sales_amount) * 100)
            if total_sales_amount > 0
            else 100
        )

        unpaid_sales_rows = [
            {
                "ref": sale.reference,
                "client": sale.client_name or "Client",
                "amount": float(sale.total_amount) - float(sale.paid_amount),
                "date": str(sale.sale_date),
            }
            for sale in summary.get("recent_sales", [])
            if (sale.total_amount - sale.paid_amount) > 0
        ]

        # Extract last user message and format conversation history
        last_user_msg = ""
        history_lines: list[str] = []
        for m in request.messages:
            role_label = "Utilisateur" if m.role == "user" else "Cora"
            history_lines.append(f"{role_label}: {m.content.strip()}")
            if m.role == "user":
                last_user_msg = m.content.strip()

        history_str = "\n".join(history_lines[-8:])  # Last 8 turns for deep multi-turn memory
        msg_lower = last_user_msg.lower()

        # 2. Check for Direct Action Intents (e.g. "Enregistre une vente", "Enregistre une dépense")
        if any(w in msg_lower for w in ["enregistre une vente", "ajoute une vente", "nouvelle vente", "enregistrer vente", "enregistre l'écolage", "enregistre ecolage"]):
            sales_action = await self.sales_agent._try_record_sale(s, org_id, user_id, last_user_msg, currency)
            if sales_action:
                return AIChatResponse(
                    reply=sales_action["reply"],
                    provider_used="Knowlia Commercial Engine",
                    model_used="koryxa-sales-recovery-agent",
                    agent_name=sales_action["agent_name"],
                    agent_badge=sales_action["agent_badge"],
                    thinking_summary=sales_action.get("thinking_summary"),
                    action_executed=sales_action.get("action_executed"),
                    suggested_actions=[SuggestedAction(**a) for a in sales_action.get("suggested_actions", [])],
                )

        if any(w in msg_lower for w in ["enregistre une dépense", "enregistre la dépense", "ajoute une dépense", "enregistrer dépense", "nouvelle dépense", "payé une dépense", "décaissement"]):
            expense_action = await self.finance_agent._try_record_expense(s, org_id, user_id, last_user_msg, currency)
            if expense_action:
                return AIChatResponse(
                    reply=expense_action["reply"],
                    provider_used="Knowlia Financial Engine",
                    model_used="koryxa-finance-agent",
                    agent_name=expense_action["agent_name"],
                    agent_badge=expense_action["agent_badge"],
                    thinking_summary=expense_action.get("thinking_summary"),
                    action_executed=expense_action.get("action_executed"),
                    suggested_actions=[SuggestedAction(**a) for a in expense_action.get("suggested_actions", [])],
                )

        # 3. Build Deep Multilingual Semantic Prompt for Knowlia LLM
        lang = getattr(request, "language", "fr") or "fr"
        lang_names = {
            "fr": "Français",
            "en": "English",
            "es": "Español",
            "pt": "Português",
            "ar": "العربية",
        }
        target_lang = lang_names.get(lang, "Français")
        unpaid_summary = ", ".join([f"{u['client']} ({u['amount']:,.0f} {currency})" for u in unpaid_sales_rows[:5]]) or "Aucun impayé en cours"

        semantic_prompt = (
            f"Tu es Cora, la Directrice des Opérations et Copilote IA de l'organisation : {org_name} ({sector_label}).\n"
            f"Interlocuteur : {responsible}\n"
            f"Devise principale : {currency}\n"
            f"LANGUE OBLIGATOIRE DE RÉPONSE : Tu DOIS obligatoirement formuler TOUTE ta réponse en {target_lang} ({lang}).\n\n"
            f"Règles et vocabulaire métier sectoriels :\n"
            f"{domain.get('kpi_rules', '')}\n\n"
            f"Registre comptable et opérationnel en temps réel (Données certifiées) :\n"
            f"• Solde Réel en Caisse Disponible : {net_cash:,.0f} {currency}\n"
            f"• Chiffre d'Affaires Total Facturé : {total_sales_amount:,.0f} {currency} ({total_sales_count} opérations)\n"
            f"• Chiffre d'Affaires Encaissé en Caisse : {total_sales_paid:,.0f} {currency} (Taux de recouvrement : {recouvrement_rate}%)\n"
            f"• Créances / Impayés à Recouvrer : {total_sales_unpaid:,.0f} {currency} [Détail : {unpaid_summary}]\n"
            f"• Dépenses & Charges Payées : {total_expenses_paid:,.0f} {currency}\n"
            f"• Alertes Stock / Articles critiques : {low_stock_count}\n"
            f"• Procédures opérationnelles actives : {procedures_count}\n\n"
            f"Historique de la conversation récente :\n"
            f"{history_str}\n\n"
            f"Consigne d'intelligence :\n"
            f"Comprends le sens exact du dernier message ({last_user_msg}). Réponds toujours avec précision, bienveillance et rigueur dans la langue cible ({target_lang}). "
            f"Règle de format : Ne jamais utiliser de markdown brut avec des doubles astérisques (**)."
        )

        # 4. Invoke LLM via Knowlia
        llm_reply = await self.call_knowlia_llm(s, org_id, user_id, semantic_prompt)

        # Suggested actions localized per language
        suggested_dict = {
            "fr": [
                SuggestedAction(title="Situation de trésorerie", action_type="send_chat", payload={"prompt": "Quelle est ma trésorerie réelle et mon solde de caisse ?"}),
                SuggestedAction(title="Chiffre d'affaires", action_type="send_chat", payload={"prompt": "Quel est mon chiffre d'affaires global ?"}),
                SuggestedAction(title="Créances à relancer", action_type="send_chat", payload={"prompt": "Quels sont les impayés prioritaires ?"}),
            ],
            "en": [
                SuggestedAction(title="Cash position", action_type="send_chat", payload={"prompt": "What is my actual cash in hand?"}),
                SuggestedAction(title="Total Revenue", action_type="send_chat", payload={"prompt": "What is my total turnover?"}),
                SuggestedAction(title="Debt recovery", action_type="send_chat", payload={"prompt": "Which clients should I follow up with for unpaid debts?"}),
            ],
            "es": [
                SuggestedAction(title="Situación de caja", action_type="send_chat", payload={"prompt": "¿Cuál es mi saldo real en caja?"}),
                SuggestedAction(title="Facturación total", action_type="send_chat", payload={"prompt": "¿Cuál es mi facturación global?"}),
                SuggestedAction(title="Cobros pendientes", action_type="send_chat", payload={"prompt": "¿Cuáles son las deudas pendientes de cobro?"}),
            ],
            "pt": [
                SuggestedAction(title="Saldo de caixa", action_type="send_chat", payload={"prompt": "Qual é o meu saldo real em caixa?"}),
                SuggestedAction(title="Faturação total", action_type="send_chat", payload={"prompt": "Qual é a minha faturação total?"}),
                SuggestedAction(title="Cobranças pendentes", action_type="send_chat", payload={"prompt": "Quais são as dívidas pendentes a cobrar?"}),
            ],
            "ar": [
                SuggestedAction(title="السيولة النقدية", action_type="send_chat", payload={"prompt": "ما هو الرصيد الفعلي في الصندوق؟"}),
                SuggestedAction(title="إجمالي الإيرادات", action_type="send_chat", payload={"prompt": "ما هو إجمالي الإيرادات والمبيعات؟"}),
                SuggestedAction(title="الديون المستحقة", action_type="send_chat", payload={"prompt": "ما هي الديون والعملاء الواجب تحصيل مبالغهم؟"}),
            ],
        }
        current_suggested = suggested_dict.get(lang, suggested_dict["fr"])

        if llm_reply:
            return AIChatResponse(
                reply=llm_reply,
                provider_used="Knowlia Intelligence Core",
                model_used="koryxa-cora-orchestrator",
                agent_name="Cora · Directrice des Opérations" if lang == "fr" else f"Cora · Operations AI ({target_lang})",
                agent_badge="🧑‍💼 Coach Exécutif",
                thinking_summary=f"Analyse contextuelle ({target_lang}) pour {org_name}...",
                action_executed=None,
                suggested_actions=current_suggested,
            )

        # 5. Intelligent Intent-Based Localized Fallback (5 Languages)
        is_greeting = any(w in msg_lower for w in ["bonjour", "salut", "bonsoir", "coucou", "hello", "hi", "hey", "hola", "buenos dias", "buenas tardes", "ola", "olá", "bom dia", "boa tarde", "مرحبا", "سلام", "اهلا", "أهلا"])
        is_sales_query = any(w in msg_lower for w in ["chiffre", "vente", "recette", "revenu", "combien on a vendu", "turnover", "revenue", "sales", "facturacion", "ventas", "faturação", "vendas", "مبيعات", "إيرادات", "ارباح"])
        is_cash_query = any(w in msg_lower for w in ["argent", "trésorerie", "tresorerie", "caisse", "solde", "dépense", "depense", "cash", "treasury", "balance", "expense", "tesoreria", "caja", "gasto", "saldo", "despesa", "صندوق", "سيولة", "مصروف"])
        is_debt_query = any(w in msg_lower for w in ["créance", "creance", "impayé", "impaye", "relance", "doit", "debt", "unpaid", "receivable", "cobro", "deuda", "divida", "cobrança", "ديون", "مستحقات", "ذمم"])

        if is_greeting:
            if lang == "en":
                reply = f"Hello {responsible}! Great to assist you at the helm of {org_name} ({sector_label}).\n\nHow can I help you today? I can analyze your figures, record live transactions, check your cash position, or guide your daily executive decisions."
            elif lang == "es":
                reply = f"¡Hola {responsible}! Un placer acompañarle en la gestión de {org_name} ({sector_label}).\n\n¿En qué puedo orientarle hoy? Puedo analizar sus cifras, registrar ventas o gastos en directo, o asesorarle en sus decisiones del día."
            elif lang == "pt":
                reply = f"Olá {responsible}! É um prazer estar ao seu lado na liderança de {org_name} ({sector_label}).\n\nComo posso ajudar hoje? Posso analisar os seus números, registar operações em tempo real ou aconselhar as suas decisões diárias."
            elif lang == "ar":
                reply = f"مرحباً بك {responsible}! يسعدني مرافقتك في قيادة وإدارة مؤسسة {org_name} ({sector_label}).\n\nكيف يمكنني مساعدتك اليوم؟ يمكنني تحليل الأرقام والسيولة، تسجيل العمليات فورياً أو تقديم استشارات داعمة لقراراتك اليومية."
            else:
                reply = f"Bonjour {responsible} ! C'est un plaisir de vous retrouver au pilotage de {org_name} ({sector_label}).\n\nComment puis-je vous aider aujourd'hui ? Je peux analyser vos chiffres, enregistrer une opération en direct ou vous conseiller sur vos décisions du jour."
        elif is_sales_query:
            if lang == "en":
                reply = (
                    f"📈 Revenue & Sales Overview for {org_name} :\n\n"
                    f"• 💰 Total Turnover : {total_sales_amount:,.0f} {currency}\n"
                    f"• 📥 Total Cash Collected : {total_sales_paid:,.0f} {currency} ({recouvrement_rate}%)\n"
                    f"• ⏳ Outstanding Receivables : {total_sales_unpaid:,.0f} {currency}\n"
                    f"• 🧾 Volume : {total_sales_count} tracked transaction(s)"
                ).replace(",", " ")
            elif lang == "es":
                reply = (
                    f"📈 Resumen de Facturación para {org_name} :\n\n"
                    f"• 💰 Facturación Total : {total_sales_amount:,.0f} {currency}\n"
                    f"• 📥 Total Cobrado en Caja : {total_sales_paid:,.0f} {currency} ({recouvrement_rate}%)\n"
                    f"• ⏳ Cobros Pendientes : {total_sales_unpaid:,.0f} {currency}\n"
                    f"• 🧾 Volumen : {total_sales_count} transacción(es) registrada(s)"
                ).replace(",", " ")
            elif lang == "pt":
                reply = (
                    f"📈 Resumo de Vendas e Faturação para {org_name} :\n\n"
                    f"• 💰 Faturação Total : {total_sales_amount:,.0f} {currency}\n"
                    f"• 📥 Total Recebido em Caixa : {total_sales_paid:,.0f} {currency} ({recouvrement_rate}%)\n"
                    f"• ⏳ Valores a Receber : {total_sales_unpaid:,.0f} {currency}\n"
                    f"• 🧾 Volume : {total_sales_count} transação(ões) registada(s)"
                ).replace(",", " ")
            elif lang == "ar":
                reply = (
                    f"📈 موجز المبيعات والإيرادات لمؤسسة {org_name} :\n\n"
                    f"• 💰 إجمالي الإيرادات المسجلة : {total_sales_amount:,.0f} {currency}\n"
                    f"• 📥 المحصل الفعلي في الصندوق : {total_sales_paid:,.0f} {currency} (بنسبة {recouvrement_rate}%)\n"
                    f"• ⏳ الديون والذمم المتبقية : {total_sales_unpaid:,.0f} {currency}\n"
                    f"• 🧾 عدد العمليات : {total_sales_count} معاملة مسجلة"
                ).replace(",", " ")
            else:
                reply = (
                    f"📈 Point sur le Chiffre d'Affaires de {org_name} :\n\n"
                    f"• 💰 Chiffre d'Affaires Total Facturé : {total_sales_amount:,.0f} {currency}\n"
                    f"• 📥 CA Réellement Encaissé : {total_sales_paid:,.0f} {currency} ({recouvrement_rate}% du total)\n"
                    f"• ⏳ CA en Attente (Créances) : {total_sales_unpaid:,.0f} {currency}\n"
                    f"• 🧾 Volume d'Opérations : {total_sales_count} transaction(s) suivie(s)"
                ).replace(",", " ")
        elif is_debt_query:
            if lang == "en":
                reply = (
                    f"⏳ Pending Receivables for {org_name} :\n\n"
                    f"• Total Unpaid : {total_sales_unpaid:,.0f} {currency}\n"
                    f"• Priority Details : {unpaid_summary}\n\n"
                    f"💡 Advice: Recovering these funds will directly improve your available cash."
                ).replace(",", " ")
            elif lang == "es":
                reply = (
                    f"⏳ Cobros Pendientes para {org_name} :\n\n"
                    f"• Total por Cobrar : {total_sales_unpaid:,.0f} {currency}\n"
                    f"• Detalle Prioritario : {unpaid_summary}\n\n"
                    f"💡 Consejo: La recuperación de estos cobros aumentará de inmediato su liquidez disponible."
                ).replace(",", " ")
            elif lang == "pt":
                reply = (
                    f"⏳ Valores Pendentes de Cobrança para {org_name} :\n\n"
                    f"• Total a Receber : {total_sales_unpaid:,.0f} {currency}\n"
                    f"• Detalhe Prioritário : {unpaid_summary}\n\n"
                    f"💡 Recomendação: A cobrança destes valores reforçará de imediato a sua tesouraria."
                ).replace(",", " ")
            elif lang == "ar":
                reply = (
                    f"⏳ الديون والذمم المستحقة للتحصيل لمؤسسة {org_name} :\n\n"
                    f"• إجمالي الديون المعلقة : {total_sales_unpaid:,.0f} {currency}\n"
                    f"• أهم العملاء ذوي المبالغ المستحقة : {unpaid_summary}\n\n"
                    f"💡 توصية: تحصيل هذه المستحقات يعزز فوراً السيولة النقدية المتاحة في الصندوق."
                ).replace(",", " ")
            else:
                reply = (
                    f"⏳ Créances et Impayés en Attente pour {org_name} :\n\n"
                    f"• Total des Impayés : {total_sales_unpaid:,.0f} {currency}\n"
                    f"• Clients Prioritaires : {unpaid_summary}\n\n"
                    f"💡 Conseil : La relance de ces créances consolidera directement votre trésorerie disponible."
                ).replace(",", " ")
        elif is_cash_query:
            if lang == "en":
                reply = (
                    f"📊 Cash Position for {org_name} :\n\n"
                    f"• 🏦 Actual Cash in Hand : {net_cash:,.0f} {currency}\n"
                    f"• 📥 Total Inflows : {total_sales_paid:,.0f} {currency}\n"
                    f"• 📤 Total Expenses Paid : {total_expenses_paid:,.0f} {currency}"
                ).replace(",", " ")
            elif lang == "es":
                reply = (
                    f"📊 Estado de Tesorería para {org_name} :\n\n"
                    f"• 🏦 Saldo Real en Caja : {net_cash:,.0f} {currency}\n"
                    f"• 📥 Total Entradas : {total_sales_paid:,.0f} {currency}\n"
                    f"• 📤 Total Gastos Pagados : {total_expenses_paid:,.0f} {currency}"
                ).replace(",", " ")
            elif lang == "pt":
                reply = (
                    f"📊 Posição de Caixa para {org_name} :\n\n"
                    f"• 🏦 Saldo Real em Caixa : {net_cash:,.0f} {currency}\n"
                    f"• 📥 Total Entradas : {total_sales_paid:,.0f} {currency}\n"
                    f"• 📤 Total Despesas Pagas : {total_expenses_paid:,.0f} {currency}"
                ).replace(",", " ")
            elif lang == "ar":
                reply = (
                    f"📊 تقرير الصندوق والسيولة لمؤسسة {org_name} :\n\n"
                    f"• 🏦 السيولة النقدية الفعلية : {net_cash:,.0f} {currency}\n"
                    f"• 📥 إجمالي المبالغ المحصلة : {total_sales_paid:,.0f} {currency}\n"
                    f"• 📤 إجمالي المصروفات المدفوعة : {total_expenses_paid:,.0f} {currency}"
                ).replace(",", " ")
            else:
                reply = (
                    f"📊 Situation de Caisse pour {org_name} :\n\n"
                    f"• 🏦 Solde Réel en Caisse : {net_cash:,.0f} {currency}\n"
                    f"• 📥 Total Encaissé : {total_sales_paid:,.0f} {currency}\n"
                    f"• 📤 Total Dépenses Payées : {total_expenses_paid:,.0f} {currency}"
                ).replace(",", " ")
        else:
            if lang == "en":
                reply = f"I am connected to your registers for {org_name}. How can I assist you specifically with your sales, cash, expenses, or team procedures?"
            elif lang == "es":
                reply = f"Estoy conectada a todos los registros de {org_name}. ¿En qué puedo ayudarle específicamente respecto a sus ventas, caja, gastos o procedimientos?"
            elif lang == "pt":
                reply = f"Estou ligada aos registos de {org_name}. Como posso ajudar especificamente em relação a vendas, caixa, despesas ou procedimentos?"
            elif lang == "ar":
                reply = f"أنا متصلة بجميع سجلات مؤسسة {org_name}. كيف يمكنني مساعدتك بدقة فيما يتعلق بالمبيعات، الصندوق، المصروفات أو خطة العمل؟"
            else:
                reply = f"Je suis connectée à l'ensemble de vos registres pour {org_name}. Que souhaitez-vous analyser ou enregistrer aujourd'hui ?"

        return AIChatResponse(
            reply=reply,
            provider_used="Cora Intelligence (KORYXA Core)",
            model_used="koryxa-cora-orchestrator",
            agent_name="Cora · Directrice des Opérations" if lang == "fr" else f"Cora · Operations AI ({target_lang})",
            agent_badge="🧑‍💼 Coach Exécutif",
            thinking_summary=f"Analyse contextuelle ({target_lang}) pour {org_name}...",
            action_executed=None,
            suggested_actions=current_suggested,
        )
