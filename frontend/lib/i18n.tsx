"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type LanguageCode = "fr" | "en" | "es" | "pt" | "ar";

export type LanguageOption = {
  code: LanguageCode;
  label: string;
  flag: string;
  dir: "ltr" | "rtl";
};

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "fr", label: "Français", flag: "🇫🇷", dir: "ltr" },
  { code: "en", label: "English", flag: "🇬🇧", dir: "ltr" },
  { code: "es", label: "Español", flag: "🇪🇸", dir: "ltr" },
  { code: "pt", label: "Português", flag: "🇵🇹", dir: "ltr" },
  { code: "ar", label: "العربية", flag: "🇸🇦", dir: "rtl" },
];

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  fr: {
    // Navigation & Groups
    group_pilotage: "Pilotage & Ventes",
    group_operations: "Équipe & Opérations",
    group_radar: "Radar & Qualité",
    group_system: "Canaux & Système",
    group_help: "Aide & Accompagnement",

    nav_cockpit: "Cockpit Décisionnel",
    nav_sales: "Ventes & Caisse",
    nav_offers: "Articles & Offres",
    nav_expenses: "Achats & Dépenses",
    nav_suppliers: "Fournisseurs",
    nav_attendance: "Présence & Pointage",
    nav_procedures: "Procédures & SOP",
    nav_documents: "Documents & Preuves",
    nav_radar: "Radar Sentinelle",
    nav_validations: "Validations IA",
    nav_actions: "Plan d'Actions",
    nav_whatsapp: "WhatsApp Gateway",
    nav_imports: "Reprise & Imports",
    nav_organization: "Organisation & Membres",
    nav_settings: "Paramètres",
    nav_manual: "Manuel & Guide Détaillé",
    nav_faq: "Foire Aux Questions (FAQ)",
    nav_feedback: "Retours & Suggestions",

    // Topbar
    topbar_eyebrow: "Mémoire opérationnelle",
    search_prompt: "Recherche & actions…",
    vocal_btn: "Vocal",
    guide_btn: "Guide",
    public_site: "Site public",
    api_connected: "API connectée",
    install_app: "Installer l'app",

    // Dashboard Header
    dash_eyebrow: "Cockpit Décisionnel",
    dash_title: "Mémoire Opérationnelle du Dirigeant",
    dash_desc: "Surveillez le chiffre d'affaires vérifié, le recouvrement des créances et la qualité de structuration de",
    btn_pdf_report: "Bilan Opérationnel (PDF)",
    btn_new_sale: "Nouvelle vente",

    // KPI Cards
    kpi_turnover: "Chiffre d'Affaires",
    kpi_sales_followed: "vente(s) suivie(s)",
    kpi_total_collected: "Total Encaissé",
    kpi_recovery_rate: "de recouvrement",
    kpi_expenses_paid: "Dépenses Payées",
    kpi_expenses_link: "dépense(s) réglée(s) →",
    kpi_cash_balance: "Solde Réel Caisse",
    kpi_cash_available: "Trésorerie disponible",
    kpi_unpaid_debts: "Créances en Attente",
    kpi_unpaid_link: "Factures impayées →",
    kpi_radar_score: "Score Radar",
    kpi_radar_healthy: "Santé Opérationnelle",

    // Briefing
    briefing_title: "Briefing Prioritaire du Dirigeant",
    briefing_ok: "Excellente nouvelle : aucun conflit ni anomalie critique détectée aujourd'hui. Vos registres de vente et vos méthodes de travail sont bien synchronisés.",
    btn_scan_radar: "Scanner avec Radar",

    // Panels
    alerts_title: "Sentinelle Opérationnelle",
    alerts_subtitle: "Alertes à Traiter",
    see_all_radar: "Voir tout Radar →",
    no_anomalies_open: "Aucune anomalie ouverte",
    no_anomalies_desc: "Vos ventes et procédures respectent les règles de conformité définies.",

    execution_eyebrow: "Exécution",
    actions_title: "Exécution",
    actions_subtitle: "Actions en Cours",
    assigned_to: "Assignée à",
    unassigned: "Non assignée",
    due_date: "Échéance",
    no_active_actions: "Aucune action corrective urgente en cours.",
    see_all_actions: "Kanban →",
    active_registers: "Registres Actifs",
    btn_action: "Action",
    btn_resolve: "Résoudre",

    quick_actions_title: "Actions Rapides",
    quick_sale: "Enregistrer une Vente",
    quick_sale_sub: "Encaissement direct et reçu WhatsApp",
    quick_expense: "Déclarer une Dépense",
    quick_expense_sub: "Décaissement et justificatif photo",
    quick_offer: "Ajouter un Article",
    quick_offer_sub: "Nouveau produit ou service",
    recent_sales_title: "Dernières Ventes & Écolages Enregistrés",
    recent_sales_desc: "Flux en direct des transactions récentes",
    see_all_sales: "Voir tout le registre des ventes",

    // Chatbot Copilot Cora
    copilot_title: "Cora · Directrice des Opérations",
    copilot_badge: "🧑‍💼 Coach Exécutif",
    copilot_welcome: "Bonjour ! Je suis Cora, votre directrice des opérations et assistante IA.\n\nJe suis connectée en temps réel à l'ensemble de vos registres (Ventes, Caisse, Dépenses, Radar et Procédures).\n\nComment puis-je vous aider aujourd'hui ? Je peux analyser vos chiffres, enregistrer une opération en direct ou vous conseiller sur vos décisions du jour.",
    copilot_placeholder: "Posez votre question ou dictez un ordre (ex: Vente de 25000 FCFA…)",
    copilot_prompt_1: "Quelle est ma trésorerie réelle en caisse ?",
    copilot_prompt_2: "Quels clients dois-je relancer en priorité ?",
    copilot_prompt_3: "Enregistre une vente de 25 000 FCFA pour M. Paul",
    copilot_prompt_4: "Fais-moi un bilan des alertes Radar de conformité",
    copilot_thinking_1: "Consultation des registres de caisse et de ventes…",
    copilot_thinking_2: "Analyse des créances et des marges bénéficiaires…",
    copilot_thinking_3: "Formulation du conseil stratégique du dirigeant…",
    copilot_phase_1: "Consultation des registres & transactions…",
    copilot_phase_2: "Analyse contextuelle & indicateurs…",
    copilot_phase_3: "Formulation du conseil stratégique…",
    copilot_phase_4: "Finalisation de la synthèse…",
    copilot_answered_in: "Généré en",
    copilot_writing: "Cora en rédaction…",
  },

  en: {
    group_pilotage: "Management & Sales",
    group_operations: "Team & Operations",
    group_radar: "Radar & Quality",
    group_system: "Channels & System",
    group_help: "Help & Support",

    nav_cockpit: "Executive Dashboard",
    nav_sales: "Sales & Cash Register",
    nav_offers: "Products & Offers",
    nav_expenses: "Purchases & Expenses",
    nav_suppliers: "Suppliers",
    nav_attendance: "Attendance & Clock-in",
    nav_procedures: "Standard Procedures (SOP)",
    nav_documents: "Documents & Evidence",
    nav_radar: "Sentinel Radar",
    nav_validations: "AI Validations",
    nav_actions: "Action Plan",
    nav_whatsapp: "WhatsApp Gateway",
    nav_imports: "Data Import & Migration",
    nav_organization: "Organization & Members",
    nav_settings: "Settings",
    nav_manual: "User Guide & Manual",
    nav_faq: "Frequently Asked Questions",
    nav_feedback: "Feedback & Suggestions",

    topbar_eyebrow: "Operational Memory",
    search_prompt: "Search & actions…",
    vocal_btn: "Voice",
    guide_btn: "Guide",
    public_site: "Public site",
    api_connected: "API connected",
    install_app: "Install app",

    dash_eyebrow: "Executive Dashboard",
    dash_title: "Executive Operational Memory",
    dash_desc: "Monitor verified revenue, debt recovery, and operational performance for",
    btn_pdf_report: "Operational Report (PDF)",
    btn_new_sale: "New sale",

    kpi_turnover: "Total Turnover",
    kpi_sales_followed: "sale(s) tracked",
    kpi_total_collected: "Total Collected",
    kpi_recovery_rate: "collection rate",
    kpi_expenses_paid: "Paid Expenses",
    kpi_expenses_link: "expense(s) settled →",
    kpi_cash_balance: "Actual Cash in Hand",
    kpi_cash_available: "Available treasury",
    kpi_unpaid_debts: "Pending Receivables",
    kpi_unpaid_link: "Unpaid invoices →",
    kpi_radar_score: "Radar Score",
    kpi_radar_healthy: "Operational Health",

    briefing_title: "Executive Priority Briefing",
    briefing_ok: "Great news: no critical anomalies or conflicts detected today. Your sales records and standard procedures are synchronized.",
    btn_scan_radar: "Scan with Radar",

    alerts_title: "Operational Sentinel",
    alerts_subtitle: "Alerts to Resolve",
    see_all_radar: "View full Radar →",
    no_anomalies_open: "No open anomalies",
    no_anomalies_desc: "Your sales and procedures comply with established operational rules.",

    execution_eyebrow: "Execution",
    actions_title: "Execution",
    actions_subtitle: "Ongoing Actions",
    assigned_to: "Assigned to",
    unassigned: "Unassigned",
    due_date: "Due date",
    no_active_actions: "No urgent corrective actions in progress.",
    see_all_actions: "Kanban →",
    active_registers: "Active Registers",
    btn_action: "Action",
    btn_resolve: "Resolve",

    quick_actions_title: "Quick Actions",
    quick_sale: "Record a Sale",
    quick_sale_sub: "Instant receipt and WhatsApp notice",
    quick_expense: "Record an Expense",
    quick_expense_sub: "Cash payout with photo receipt",
    quick_offer: "Add a Product / Service",
    quick_offer_sub: "New catalogue item",
    recent_sales_title: "Recent Sales & Payments Recorded",
    recent_sales_desc: "Live stream of verified transactions",
    see_all_sales: "View complete sales register",

    copilot_title: "Cora · Chief Operations AI",
    copilot_badge: "🧑‍💼 Executive Coach",
    copilot_welcome: "Hello! I am Cora, your operations director and AI executive assistant.\n\nI am connected in real time to all your business registers (Sales, Cash, Expenses, Radar, and SOPs).\n\nHow can I help you today? I can analyze your figures, record live transactions, or guide your key decisions.",
    copilot_placeholder: "Ask a question or dictate an order (e.g., Sale of $250 to John…)",
    copilot_prompt_1: "What is my actual cash in hand?",
    copilot_prompt_2: "Which clients should I follow up with for unpaid debts?",
    copilot_prompt_3: "Record a sale of $250 for Paul",
    copilot_prompt_4: "Give me an operational summary of Radar alerts",
    copilot_thinking_1: "Reading cash registers and sales ledger…",
    copilot_thinking_2: "Analyzing receivables and profit margins…",
    copilot_thinking_3: "Formulating executive strategic recommendations…",
    copilot_phase_1: "Reading financial registers & ledger…",
    copilot_phase_2: "Contextual analysis & indicators…",
    copilot_phase_3: "Formulating strategic advice…",
    copilot_phase_4: "Finalizing executive reply…",
    copilot_answered_in: "Generated in",
    copilot_writing: "Cora is writing…",
  },

  es: {
    group_pilotage: "Gestión y Ventas",
    group_operations: "Equipo y Operaciones",
    group_radar: "Radar y Calidad",
    group_system: "Canales y Sistema",
    group_help: "Ayuda y Soporte",

    nav_cockpit: "Panel de Control",
    nav_sales: "Ventas y Caja",
    nav_offers: "Productos y Ofertas",
    nav_expenses: "Compras y Gastos",
    nav_suppliers: "Proveedores",
    nav_attendance: "Asistencia y Fichaje",
    nav_procedures: "Procedimientos (SOP)",
    nav_documents: "Documentos y Pruebas",
    nav_radar: "Radar Centinela",
    nav_validations: "Validaciones IA",
    nav_actions: "Plan de Acciones",
    nav_whatsapp: "Pasarela WhatsApp",
    nav_imports: "Migración e Importación",
    nav_organization: "Organización y Miembros",
    nav_settings: "Configuración",
    nav_manual: "Manual y Guía",
    nav_faq: "Preguntas Frecuentes",
    nav_feedback: "Sugerencias",

    topbar_eyebrow: "Memoria Operativa",
    search_prompt: "Buscar y acciones…",
    vocal_btn: "Voz",
    guide_btn: "Guía",
    public_site: "Sitio web",
    api_connected: "API conectada",
    install_app: "Instalar app",

    dash_eyebrow: "Panel de Control",
    dash_title: "Memoria Operativa del Director",
    dash_desc: "Supervise la facturación verificada, el cobro de deudas y la estructura de",
    btn_pdf_report: "Informe Operativo (PDF)",
    btn_new_sale: "Nueva venta",

    kpi_turnover: "Facturación Total",
    kpi_sales_followed: "venta(s) registrada(s)",
    kpi_total_collected: "Total Cobrado",
    kpi_recovery_rate: "tasa de cobro",
    kpi_expenses_paid: "Gastos Pagados",
    kpi_expenses_link: "gasto(s) pagado(s) →",
    kpi_cash_balance: "Saldo Real en Caja",
    kpi_cash_available: "Tesorería disponible",
    kpi_unpaid_debts: "Cobros Pendientes",
    kpi_unpaid_link: "Facturas pendientes →",
    kpi_radar_score: "Puntuación Radar",
    kpi_radar_healthy: "Salud Operativa",

    briefing_title: "Resumen Prioritario del Director",
    briefing_ok: "Excelente noticia: no se han detectado anomalías críticas hoy. Sus registros y procedimientos están completamente sincronizados.",
    btn_scan_radar: "Escanear con Radar",

    alerts_title: "Centinela Operativo",
    alerts_subtitle: "Alertas a Resolver",
    see_all_radar: "Ver todo el Radar →",
    no_anomalies_open: "Ninguna anomalía abierta",
    no_anomalies_desc: "Sus ventas y procedimientos cumplen las reglas operativas establecidas.",

    execution_eyebrow: "Ejecución",
    actions_title: "Ejecución",
    actions_subtitle: "Acciones en Curso",
    assigned_to: "Asignada a",
    unassigned: "Sin asignar",
    due_date: "Vencimiento",
    no_active_actions: "No hay acciones correctivas urgentes en curso.",
    see_all_actions: "Kanban →",
    active_registers: "Registros Activos",
    btn_action: "Acción",
    btn_resolve: "Resolver",

    quick_actions_title: "Acciones Rápidas",
    quick_sale: "Registrar una Venta",
    quick_sale_sub: "Cobro directo y recibo WhatsApp",
    quick_expense: "Registrar un Gasto",
    quick_expense_sub: "Desembolso y foto del recibo",
    quick_offer: "Añadir Artículo",
    quick_offer_sub: "Nuevo producto o servicio",
    recent_sales_title: "Últimas Ventas y Pagos Registrados",
    recent_sales_desc: "Flujo en tiempo real de transacciones",
    see_all_sales: "Ver registro completo de ventas",

    copilot_title: "Cora · Directora de Operaciones IA",
    copilot_badge: "🧑‍💼 Coach Ejecutivo",
    copilot_welcome: "¡Hola! Soy Cora, su directora de operaciones y asistente ejecutiva de IA.\n\nEstoy conectada en tiempo real a todos sus registros comerciales (Ventas, Caja, Gastos, Radar y Procedimientos).\n\n¿En qué puedo ayudarle hoy? Puedo analizar sus cifras, registrar operaciones o asesorarle en sus decisiones.",
    copilot_placeholder: "Haga una pregunta o dicte una orden (ej: Venta de 25000 FCFA a Carlos…)",
    copilot_prompt_1: "¿Cuál es mi saldo real en caja?",
    copilot_prompt_2: "¿A qué clientes debo reclamar pagos pendientes?",
    copilot_prompt_3: "Registra una venta de 25000 FCFA para Pedro",
    copilot_prompt_4: "Hazme un balance de las alertas del Radar",
    copilot_thinking_1: "Consultando libros de caja y ventas…",
    copilot_thinking_2: "Analizando deudas y márgenes de beneficio…",
    copilot_thinking_3: "Formulando recomendaciones estratégicas…",
    copilot_phase_1: "Consultando registros y caja…",
    copilot_phase_2: "Análisis contextual e indicadores…",
    copilot_phase_3: "Formulando consejo estratégico…",
    copilot_phase_4: "Finalizando respuesta…",
    copilot_answered_in: "Generado en",
    copilot_writing: "Cora redactando…",
  },

  pt: {
    group_pilotage: "Gestão e Vendas",
    group_operations: "Equipe e Operações",
    group_radar: "Radar e Qualidade",
    group_system: "Canais e Sistema",
    group_help: "Ajuda e Suporte",

    nav_cockpit: "Painel de Controle",
    nav_sales: "Vendas e Caixa",
    nav_offers: "Produtos e Ofertas",
    nav_expenses: "Compras e Despesas",
    nav_suppliers: "Fornecedores",
    nav_attendance: "Presença e Ponto",
    nav_procedures: "Procedimentos (SOP)",
    nav_documents: "Documentos e Registros",
    nav_radar: "Radar Sentinela",
    nav_validations: "Validações IA",
    nav_actions: "Plano de Ações",
    nav_whatsapp: "Portal WhatsApp",
    nav_imports: "Importação de Dados",
    nav_organization: "Organização e Equipe",
    nav_settings: "Configurações",
    nav_manual: "Manual e Guia",
    nav_faq: "Perguntas Frequentes",
    nav_feedback: "Comentários",

    topbar_eyebrow: "Memória Operacional",
    search_prompt: "Pesquisar e ações…",
    vocal_btn: "Voz",
    guide_btn: "Guia",
    public_site: "Site público",
    api_connected: "API conectada",
    install_app: "Instalar app",

    dash_eyebrow: "Painel de Controle",
    dash_title: "Memória Operacional do Gestor",
    dash_desc: "Acompanhe a faturação verificada, a cobrança de créditos e o desempenho de",
    btn_pdf_report: "Relatório Operacional (PDF)",
    btn_new_sale: "Nova venda",

    kpi_turnover: "Faturação Total",
    kpi_sales_followed: "venda(s) registada(s)",
    kpi_total_collected: "Total Recebido",
    kpi_recovery_rate: "taxa de cobrança",
    kpi_expenses_paid: "Despesas Pagas",
    kpi_expenses_link: "despesa(s) liquidada(s) →",
    kpi_cash_balance: "Saldo Real em Caixa",
    kpi_cash_available: "Tesouraria disponível",
    kpi_unpaid_debts: "Valores a Receber",
    kpi_unpaid_link: "Faturas pendentes →",
    kpi_radar_score: "Pontuação Radar",
    kpi_radar_healthy: "Saúde Operacional",

    briefing_title: "Briefing Prioritário do Gestor",
    briefing_ok: "Excelente notícia: nenhuma anomalia crítica detetada hoje. Os seus registos e métodos de trabalho estão sincronizados.",
    btn_scan_radar: "Verificar com Radar",

    alerts_title: "Sentinela Operacional",
    alerts_subtitle: "Alertas a Tratar",
    see_all_radar: "Ver todo o Radar →",
    no_anomalies_open: "Nenhuma anomalia aberta",
    no_anomalies_desc: "As suas vendas e procedimentos respeitam as regras operacionais estabelecidas.",

    execution_eyebrow: "Execução",
    actions_title: "Execução",
    actions_subtitle: "Ações em Curso",
    assigned_to: "Atribuída a",
    unassigned: "Não atribuída",
    due_date: "Prazo",
    no_active_actions: "Nenhuma ação corretiva urgente em curso.",
    see_all_actions: "Kanban →",
    active_registers: "Registos Ativos",
    btn_action: "Ação",
    btn_resolve: "Resolver",

    quick_actions_title: "Ações Rápidas",
    quick_sale: "Registar uma Venda",
    quick_sale_sub: "Cobrança direta e recibo WhatsApp",
    quick_expense: "Lançar uma Despesa",
    quick_expense_sub: "Pagamento e comprovativo fotográfico",
    quick_offer: "Adicionar Artigo",
    quick_offer_sub: "Novo produto ou serviço",
    recent_sales_title: "Últimas Vendas e Pagamentos Registados",
    recent_sales_desc: "Fluxo em direto das transações recentes",
    see_all_sales: "Ver registo completo de vendas",

    copilot_title: "Cora · Diretora de Operações IA",
    copilot_badge: "🧑‍💼 Coach Executivo",
    copilot_welcome: "Olá! Sou a Cora, a sua diretora de operações e assistente executiva de IA.\n\nEstou ligada em tempo real a todos os seus registos comerciais (Vendas, Caixa, Despesas, Radar e Procedimentos).\n\nComo posso ajudar hoje? Posso analisar os seus números, registar operações ou aconselhar decisões de gestão.",
    copilot_placeholder: "Faça uma pergunta ou dite uma ordem (ex: Venda de 25000 FCFA a João…)",
    copilot_prompt_1: "Qual é o meu saldo real em caixa?",
    copilot_prompt_2: "Quais clientes devo cobrar com prioridade?",
    copilot_prompt_3: "Regista uma venda de 25000 FCFA para Paulo",
    copilot_prompt_4: "Faz um resumo dos alertas do Radar",
    copilot_thinking_1: "Consultando registos de caixa e vendas…",
    copilot_thinking_2: "Analisando créditos pendentes e margens…",
    copilot_thinking_3: "Formulando recomendações estratégicas…",
    copilot_phase_1: "Consultando registos e caixa…",
    copilot_phase_2: "Análise contextual e indicadores…",
    copilot_phase_3: "Formulando conselho estratégico…",
    copilot_phase_4: "Finalizando resposta…",
    copilot_answered_in: "Gerado em",
    copilot_writing: "Cora a redigir…",
  },

  ar: {
    group_pilotage: "الإدارة والمبيعات",
    group_operations: "الفريق والعمليات",
    group_radar: "الرقابة والجودة",
    group_system: "القنوات والنظام",
    group_help: "المساعدة والدعم",

    nav_cockpit: "لوحة التحكم الرئيسية",
    nav_sales: "المبيعات والصندوق",
    nav_offers: "المنتجات والعروض",
    nav_expenses: "المشتريات والمصروفات",
    nav_suppliers: "الموردون",
    nav_attendance: "الحضور وتسجيل الدوام",
    nav_procedures: "إجراءات العمل (SOP)",
    nav_documents: "المستندات والوثائق",
    nav_radar: "رادار الرقابة الذكي",
    nav_validations: "الموافقات الذكية",
    nav_actions: "خطة المهام",
    nav_whatsapp: "بوابة واتساب",
    nav_imports: "استيراد البيانات",
    nav_organization: "المؤسسة والأعضاء",
    nav_settings: "الإعدادات",
    nav_manual: "دليل الاستخدام",
    nav_faq: "الأسئلة الشائعة",
    nav_feedback: "الملاحظات والمقترحات",

    topbar_eyebrow: "الذاكرة التشغيلية",
    search_prompt: "بحث وإجراءات…",
    vocal_btn: "صوتي",
    guide_btn: "دليل",
    public_site: "الموقع العام",
    api_connected: "متصل بالخادم",
    install_app: "تثبيت التطبيق",

    dash_eyebrow: "لوحة التحكم الرئيسية",
    dash_title: "الذاكرة التشغيلية للمدير",
    dash_desc: "راقب الإيرادات الموثقة وتحصيل الديون وجودة هيكلة",
    btn_pdf_report: "التقرير التشغيلي (PDF)",
    btn_new_sale: "تسجيل بيع جديد",

    kpi_turnover: "إجمالي الإيرادات",
    kpi_sales_followed: "عملية بيع مسجلة",
    kpi_total_collected: "إجمالي المحصل",
    kpi_recovery_rate: "نسبة التحصيل",
    kpi_expenses_paid: "المصروفات المدفوعة",
    kpi_expenses_link: "مصروف(ات) مسددة ←",
    kpi_cash_balance: "الرصيد الفعلي في الصندوق",
    kpi_cash_available: "السيولة النقدية المتاحة",
    kpi_unpaid_debts: "الديون المستحقة للتحصيل",
    kpi_unpaid_link: "الفواتير غير المسددة ←",
    kpi_radar_score: "مؤشر الرادار",
    kpi_radar_healthy: "السلامة التشغيلية",

    briefing_title: "الموجز اليومي للمدير",
    briefing_ok: "أخبار ممتازة: لم يتم رصد أي خلل أو أخطاء حرجة اليوم. سجلاتك التشغيلية متطابقة ومنظمة بالكامل.",
    btn_scan_radar: "فحص بالرادار",

    alerts_title: "الرقابة الذكية",
    alerts_subtitle: "تنبيهات للمتابعة",
    see_all_radar: "عرض كل الرادار ←",
    no_anomalies_open: "لا توجد أي أخطاء أو مخالفات مفتوحة",
    no_anomalies_desc: "مبيعاتك وإجراءات العمل مطابقة تماماً للقواعد التشغيلية المعتمدة.",

    execution_eyebrow: "التنفيذ",
    actions_title: "التنفيذ",
    actions_subtitle: "المهام الجارية",
    assigned_to: "مسندة إلى",
    unassigned: "غير مسندة",
    due_date: "تاريخ الاستحقاق",
    no_active_actions: "لا توجد أي مهام تصحيحية عاجلة قيد التنفيذ.",
    see_all_actions: "لوحة كانبان ←",
    active_registers: "السجلات التشغيلية النشطة",
    btn_action: "مهمة",
    btn_resolve: "معالجة",

    quick_actions_title: "إجراءات سريعة",
    quick_sale: "تسجيل عملية بيع",
    quick_sale_sub: "تحصيل فوري وإشعار واتساب",
    quick_expense: "تسجيل مصروف جديد",
    quick_expense_sub: "صرف نقد وإرفاق إيصال",
    quick_offer: "إضافة منتج أو خدمة",
    quick_offer_sub: "صنف جديد في الدليل",
    recent_sales_title: "آخر المبيعات والمدفوعات المسجلة",
    recent_sales_desc: "بث مباشر للمعاملات المؤكدة",
    see_all_sales: "عرض كل سجل المبيعات",

    copilot_title: "كورا · مديرة العمليات الذكية",
    copilot_badge: "🧑‍💼 مستشار تنفيذي",
    copilot_welcome: "مرحباً بك! أنا كورا، مديرة العمليات والمساعدة التنفيذية بالذكاء الاصطناعي.\n\nأنا متصلة في الوقت الفعلي بجميع سجلاتك (المبيعات، الصندوق، المصروفات، الرادار والإجراءات).\n\nكيف يمكنني مساعدتك اليوم؟ يمكنني تحليل الأرقام، تسجيل العمليات فورياً أو تقديم استشارات لاتخاذ القرارات.",
    copilot_placeholder: "اطرح سؤالك أو املِ أمراً صوتياً (مثال: تسجيل بيع بـ 25000 فرنك للسيد أحمد…)",
    copilot_prompt_1: "ما هو الرصيد الفعلي في الصندوق والسيولة؟",
    copilot_prompt_2: "من هم العملاء الواجب مطالبتهم بالديون أولاً؟",
    copilot_prompt_3: "سجل عملية بيع بقيمة 25,000 فرنك لمحمد",
    copilot_prompt_4: "قدم لي تقريراً شاملاً عن تنبيهات الرادار",
    copilot_thinking_1: "جاري فحص سجلات الصندوق والمبيعات…",
    copilot_thinking_2: "تحليل الديون وهوامش الربحية…",
    copilot_thinking_3: "صياغة التوصيات الإدارية الاستراتيجية…",
    copilot_phase_1: "فحص سجلات الصندوق والمعاملات…",
    copilot_phase_2: "التحليل الذكي ومؤشرات الأداء…",
    copilot_phase_3: "صياغة التوصيات الإدارية…",
    copilot_phase_4: "إنهاء وإعداد التقرير…",
    copilot_answered_in: "تم التوليد في",
    copilot_writing: "كورا تقوم بالتحرير…",
  },
};

interface I18nContextType {
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: "fr",
  setLang: () => {},
  t: (key: string) => key,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>("fr");

  useEffect(() => {
    const saved = window.localStorage.getItem("koryxa:language") as LanguageCode;
    if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
      setLangState(saved);
      document.documentElement.lang = saved;
      document.documentElement.dir = saved === "ar" ? "rtl" : "ltr";
    }

    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<LanguageCode>;
      if (customEvent.detail && SUPPORTED_LANGUAGES.some((l) => l.code === customEvent.detail)) {
        setLangState(customEvent.detail);
        document.documentElement.lang = customEvent.detail;
        document.documentElement.dir = customEvent.detail === "ar" ? "rtl" : "ltr";
      }
    };

    window.addEventListener("koryxa:language-changed", handler);
    return () => window.removeEventListener("koryxa:language-changed", handler);
  }, []);

  const setLang = (newLang: LanguageCode) => {
    setLangState(newLang);
    window.localStorage.setItem("koryxa:language", newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
    window.dispatchEvent(new CustomEvent("koryxa:language-changed", { detail: newLang }));
  };

  const t = (key: string): string => {
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.fr[key] || key;
  };

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
