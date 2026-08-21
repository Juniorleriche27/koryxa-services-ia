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
    actions_title: "Exécution",
    actions_subtitle: "Actions en Cours",
    see_all_actions: "Kanban →",
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
    actions_title: "Execution",
    actions_subtitle: "Ongoing Actions",
    see_all_actions: "Kanban →",
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
    actions_title: "Ejecución",
    actions_subtitle: "Acciones en Curso",
    see_all_actions: "Kanban →",
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
    actions_title: "Execução",
    actions_subtitle: "Ações em Curso",
    see_all_actions: "Kanban →",
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
    actions_title: "التنفيذ",
    actions_subtitle: "المهام الجارية",
    see_all_actions: "لوحة كانبان ←",
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
