"use client";
import { useI18n } from "@/lib/i18n";

import { useState, useMemo, useEffect } from "react";
import clsx from "clsx";
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Check,
  Clock,
  Eye,
  RefreshCw,
  Sparkles,
  Pencil,
  Archive,
  DollarSign,
  TrendingUp,
  AlertCircle,
  FileSpreadsheet,
  Package,
  CreditCard,
  Printer,
  FileText,
  Tag,
  Share2,
  Maximize2,
  Minimize2,
  Plus,
  ShoppingBag,
} from "lucide-react";
import { StatusPill } from "./Ui";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { PaymentReminderDialog } from "./PaymentReminderDialog";
import { CommercialDocumentViewer } from "./CommercialDocumentViewer";
import { RecordPaymentModal } from "./RecordPaymentModal";

export interface SaleItem {
  id: string;
  reference: string;
  document_type?: "quote" | "proforma" | "invoice" | "receipt" | string;
  sale_date: string;
  due_date?: string | null;
  client_name?: string | null;
  client_phone?: string | null;
  client_email?: string | null;
  offer_id?: string | null;
  item_label: string;
  quantity: string | number;
  unit_price: string | number;
  discount: string | number;
  total_amount: string | number;
  paid_amount?: string | number | null;
  deposit_percentage?: string | number | null;
  payment_history?: Array<{
    date: string;
    amount: string | number;
    method: string;
    comment?: string;
  }>;
  currency: string;
  payment_method?: string | null;
  payment_status: "paid" | "unpaid" | "partial" | "cancelled" | "refunded" | string;
  seller_user_id?: string | null;
  sales_channel?: string | null;
  comment?: string | null;
  status: string;
  source: string;
  created_at?: string;
  updated_at?: string;
}

export interface OfferItem {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  price?: string | null;
  currency: string;
  billing_unit?: string | null;
  conditions?: string | null;
  status: string;
  effective_from?: string | null;
  expires_at?: string | null;
  track_stock?: boolean;
  stock_quantity?: string | number | null;
  min_stock_alert?: string | number | null;
  cost_price?: string | number | null;
  updated_at: string;
}

export interface ProcedureItem {
  id: string;
  title: string;
  objective?: string | null;
  department?: string | null;
  status: string;
  version: number;
  responsible_user_id?: string | null;
  next_review_date?: string | null;
  created_at?: string;
  steps?: Array<{ position: number; title: string; description?: string | null }>;
}

export function formatMoney(value: string | number | null | undefined, currency = "XOF") {
  if (value == null || value === "") return "Sur devis";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  const formatted = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(num);
  return `${formatted} ${currency}`;
}

export function formatDate(val: string | null | undefined, includeTime = true) {
  if (!val) return "—";
  try {
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return String(val);
    if (includeTime && (val.includes("T") || (val.includes(":") && val.length > 10))) {
      return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d).replace(":", "h");
    }
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
  } catch {
    return String(val);
  }
}

export function formatLabel(value: unknown) {
  if (!value) return "—";
  const translations: Record<string, string> = {
    paid: "Payé",
    unpaid: "Non payé",
    partial: "Partiel",
    cancelled: "Annulé",
    active: "Actif",
    draft: "Brouillon",
    archived: "Archivé",
    validated: "Validé",
    pending: "En attente",
    virement: "Virement",
    especes: "Espèces",
    cheque: "Chèque",
    carte: "Carte bancaire",
    mobile_money: "Mobile Money",
    direct: "Direct",
    whatsapp: "WhatsApp",
    web: "Site Web",
    todo: "À faire",
    in_progress: "En cours",
    blocked: "Bloqué",
    completed: "Terminé",
    consistency: "Cohérence des calculs",
    completeness: "Information manquante",
    freshness: "Échéance dépassée",
    traceability: "Traçabilité & Validation",
    open: "À traiter",
    acknowledged: "En cours de traitement",
    resolved: "Résolu",
    high: "Important",
    critical: "Critique",
    normal: "Normal",
    low: "Faible",
  };
  const key = String(value).toLowerCase();
  return translations[key] ?? String(value).replaceAll("_", " ");
}

export function getDocumentTypeMeta(docType?: string) {
  switch (docType) {
    case "quote":
      return { label: "Devis", icon: "🏷️", color: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300" };
    case "proforma":
      return { label: "Pro Forma", icon: "📄", color: "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300" };
    case "receipt":
      return { label: "Reçu", icon: "✅", color: "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950 dark:text-teal-300" };
    case "invoice":
    default:
      return { label: "Facture", icon: "🧾", color: "bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-slate-200" };
  }
}

export function getDueDateBadge(sale: SaleItem) {
  if (sale.payment_status === "paid") {
    return { text: "✓ Soldé", color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300" };
  }
  if (!sale.due_date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(sale.due_date);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: `🚨 Retard ${Math.abs(diffDays)}j`, color: "bg-red-50 text-red-700 border-red-200 font-black dark:bg-red-950 dark:text-red-300" };
  }
  if (diffDays === 0) {
    return { text: "⚡ Échéance ce jour", color: "bg-amber-50 text-amber-700 border-amber-200 font-bold dark:bg-amber-950 dark:text-amber-300" };
  }
  return { text: `📅 Dans ${diffDays}j`, color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300" };
}

/* =========================================================================
   SALES TABLE INTERACTIVE
   ========================================================================= */
interface SalesTableInteractiveProps {
  sales: SaleItem[];
  organizationName?: string;
  organizationCategory?: string;
  onSelect: (sale: SaleItem) => void;
  onEdit: (sale: SaleItem) => void;
  onArchive: (id: string) => void;
  onRefresh: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onAddSale?: () => void;
  onOpenPos?: () => void;
}

export function SalesTableInteractive({

  sales,
  organizationName = "ECO",
  organizationCategory = "Commerce & Distribution",
  onSelect,
  onEdit,
  onArchive,
  onRefresh,
  isFullscreen,
  onToggleFullscreen,
  onAddSale,
  onOpenPos,
}: SalesTableInteractiveProps) {
  const { t, lang } = useI18n();
  const [internalFullscreen, setInternalFullscreen] = useState(false);
  const isTableFullscreen = isFullscreen !== undefined ? isFullscreen : internalFullscreen;
  const toggleTableFullscreen = onToggleFullscreen || (() => setInternalFullscreen((prev) => !prev));

  useEffect(() => {
    if (isTableFullscreen) {
      document.body.classList.add("kx-fullpage-mode");
    } else {
      document.body.classList.remove("kx-fullpage-mode");
    }
    return () => {
      document.body.classList.remove("kx-fullpage-mode");
    };
  }, [isTableFullscreen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isTableFullscreen) {
        toggleTableFullscreen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTableFullscreen, toggleTableFullscreen]);

  const [query, setQuery] = useState("");
  const [filterTab, setFilterTab] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof SaleItem>("sale_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Modals state
  const [reminderSale, setReminderSale] = useState<SaleItem | null>(null);
  const [viewerDoc, setViewerDoc] = useState<SaleItem | null>(null);
  const [paymentSale, setPaymentSale] = useState<SaleItem | null>(null);

  const handleSort = (field: keyof SaleItem) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const handleConvert = async (doc: SaleItem, targetType: "invoice" | "receipt") => {
    try {
      await serviceIaFetch(`/registers/sales/${doc.id}/convert`, {
        method: "POST",
        body: JSON.stringify({ target_type: targetType }),
      });
      onRefresh();
      if (viewerDoc?.id === doc.id) {
        setViewerDoc(null);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur de conversion");
    }
  };

  const filteredSales = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return sales
      .filter((s) => {
        if (filterTab === "invoices" && (s.document_type === "quote" || s.document_type === "proforma")) return false;
        if (filterTab === "quotes" && s.document_type !== "quote" && s.document_type !== "proforma") return false;
        if (filterTab === "partials" && s.payment_status !== "partial") return false;
        if (filterTab === "overdue") {
          if (s.payment_status === "paid") return false;
          if (!s.due_date || s.due_date >= todayStr) return false;
        }
        if (filterTab === "paid" && s.payment_status !== "paid") return false;

        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
          s.reference.toLowerCase().includes(q) ||
          (s.client_name || "").toLowerCase().includes(q) ||
          s.item_label.toLowerCase().includes(q) ||
          (s.payment_method || "").toLowerCase().includes(q) ||
          (s.comment || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (valA == null) return 1;
        if (valB == null) return -1;
        if (sortField === "total_amount" || sortField === "quantity" || sortField === "unit_price") {
          const numA = Number(valA) || 0;
          const numB = Number(valB) || 0;
          return sortOrder === "asc" ? numA - numB : numB - numA;
        }
        return sortOrder === "asc"
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
  }, [sales, query, filterTab, sortField, sortOrder]);

  const exportFilteredCsv = () => {
    const headers = [
      "Référence",
      "Type",
      "Date",
      "Échéance",
      "Client",
      "Article / Service",
      "Quantité",
      "Prix unitaire",
      "Montant total",
      "Encaissé",
      "Solde dû",
      "Devise",
      "État du paiement",
      "Mode",
      "Canal",
    ];
    const rows = filteredSales.map((s) => {
      const tot = Number(s.total_amount) || 0;
      const paid = Number(s.paid_amount || (s.payment_status === "paid" ? tot : 0));
      const bal = Math.max(0, tot - paid);
      return [
        `"${s.reference}"`,
        `"${s.document_type || "invoice"}"`,
        `"${s.sale_date}"`,
        `"${s.due_date || ""}"`,
        `"${s.client_name || ""}"`,
        `"${s.item_label}"`,
        s.quantity,
        s.unit_price,
        tot,
        paid,
        bal,
        s.currency,
        s.payment_status,
        `"${s.payment_method || ""}"`,
        `"${s.sales_channel || ""}"`,
      ];
    });
    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ventes_koryxa_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // KPI Calculations
  const totalAmount = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + (Number(s.total_amount) || 0), 0);
  }, [filteredSales]);

  const paidAmount = useMemo(() => {
    return filteredSales.reduce((acc, s) => {
      const tot = Number(s.total_amount) || 0;
      const p = s.paid_amount != null ? Number(s.paid_amount) : s.payment_status === "paid" ? tot : 0;
      return acc + p;
    }, 0);
  }, [filteredSales]);

  const unpaidAmount = Math.max(0, totalAmount - paidAmount);
  const recoveryRate = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 100;
  const currency = sales[0]?.currency || "XOF";

  // Tab counts
  const todayStr = new Date().toISOString().slice(0, 10);
  const quotesCount = sales.filter((s) => s.document_type === "quote" || s.document_type === "proforma").length;
  const partialsCount = sales.filter((s) => s.payment_status === "partial").length;
  const overdueCount = sales.filter((s) => s.payment_status !== "paid" && s.due_date && s.due_date < todayStr).length;
  const paidCount = sales.filter((s) => s.payment_status === "paid").length;

  return (
    <div
      className={clsx(
        "kx-table-wrapper flex flex-col gap-4 transition-all duration-150",
        isTableFullscreen &&
          "!fixed !inset-0 !z-50 !bg-background !w-screen !h-screen !overflow-y-auto !p-4 sm:!p-8 !m-0 shadow-2xl"
      )}
    >
      {/* Fullscreen Sticky Exit Bar with Operations Actions */}
      {isTableFullscreen && (
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/80 bg-background/95 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
              ⛶
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-foreground tracking-tight m-0">
                {t("sales_title")} — {t("common_fullscreen")}
              </h2>
              <p className="text-[11px] text-muted-foreground m-0">
                {t("sales_desc")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenPos && (
              <button
                type="button"
                className="app-button app-button-secondary text-xs"
                onClick={onOpenPos}
                title="Ouvrir la caisse tactile comptoir pour encaissement rapide"
              >
                <ShoppingBag size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>{t("sales_btn_pos")}</span>
              </button>
            )}

            {onAddSale && (
              <button
                type="button"
                className="app-button app-button-primary text-xs"
                onClick={onAddSale}
              >
                <Plus size={14} />
                <span>{t("sales_btn_new")}</span>
              </button>
            )}

            <button
              type="button"
              onClick={toggleTableFullscreen}
              className="px-3.5 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer shadow-md"
            >
              <Minimize2 size={14} />
              <span>{t("common_exit_fullscreen")}</span>
            </button>
          </div>
        </div>
      )}

      {/* Live KPIs Header - High Contrast Clean Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              {t("sales_kpi_invoiced")}
            </span>
            <span className="w-2 h-2 rounded-full bg-foreground/40" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground mt-1.5 font-mono">
            {formatMoney(totalAmount, currency)}
          </div>
          <div className="text-xs text-muted-foreground mt-1 font-medium">
            {filteredSales.length} {t("sales_kpi_docs_sub")}
          </div>
        </div>

        <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              {t("sales_kpi_collected")}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5 font-mono">
            {formatMoney(paidAmount, currency)}
          </div>
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {recoveryRate}% {t("sales_kpi_recovery_sub")}
          </div>
        </div>

        <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              {t("sales_kpi_unpaid")}
            </span>
            <span className={`w-2 h-2 rounded-full ${unpaidAmount > 0 ? "bg-amber-500" : "bg-muted"}`} />
          </div>
          <div className={`text-xl sm:text-2xl font-black mt-1.5 font-mono ${unpaidAmount > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
            {formatMoney(unpaidAmount, currency)}
          </div>
          <div className="text-xs text-muted-foreground mt-1 font-medium">
            {filteredSales.filter((s) => s.payment_status !== "paid").length} {t("sales_kpi_unpaid_sub")}
          </div>
        </div>
      </div>

      {/* Controls Bar & Filter Tabs */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="app-search kx-search-box flex-1 min-w-[240px]">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("sales_search_placeholder")}
            />
          </label>

          <button
            type="button"
            className="app-button app-button-secondary text-xs"
            onClick={exportFilteredCsv}
            title="Exporter en CSV"
          >
            <Download size={14} />
            <span>{t("common_export_csv")} ({filteredSales.length})</span>
          </button>
        </div>

        {/* Quick Filter Tabs - Single Row Horizontal Swipe Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 shrink-0 -mx-1 px-1">
          {[
            { id: "all", label: t("sales_tab_all"), count: sales.length },
            { id: "invoices", label: t("sales_tab_invoices"), count: sales.length - quotesCount },
            { id: "quotes", label: t("sales_tab_quotes"), count: quotesCount },
            { id: "partials", label: t("sales_tab_partial"), count: partialsCount },
            { id: "overdue", label: t("sales_tab_late"), count: overdueCount },
            { id: "paid", label: t("sales_tab_paid"), count: paidCount },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 border ${
                filterTab === tab.id
                  ? "bg-slate-950 text-white border-slate-950 dark:bg-white dark:text-slate-950 dark:border-white shadow-xs"
                  : "bg-card text-muted-foreground border-border hover:border-slate-400 hover:text-foreground"
              }`}
              onClick={() => setFilterTab(tab.id)}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  filterTab === tab.id
                    ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-950"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="app-table-scroll kx-rich-table-scroll rounded-2xl border border-border overflow-hidden">
        <table className="app-data-table kx-rich-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("reference")} className="kx-th-sortable">
                <div className="kx-th-inner">
                  <span>{t("sales_th_doc")}</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th onClick={() => handleSort("sale_date")} className="kx-th-sortable">
                <div className="kx-th-inner">
                  <span>{t("sales_th_date")}</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th onClick={() => handleSort("client_name")} className="kx-th-sortable">
                <div className="kx-th-inner">
                  <span>{t("sales_th_client")}</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th>{t("sales_th_item")}</th>
              <th onClick={() => handleSort("total_amount")} className="kx-th-sortable app-number">
                <div className="kx-th-inner app-number">
                  <span>{t("sales_th_amounts")}</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th style={{ textAlign: "center" }}>{t("common_actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                  {t("sales_empty_title")}
                </td>
              </tr>
            ) : (
              filteredSales.map((sale) => {
                const total = Number(sale.total_amount) || 0;
                const paid = Number(sale.paid_amount || (sale.payment_status === "paid" ? total : 0));
                const balance = Math.max(0, total - paid);
                const percentPaid = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 100;
                const docMeta = getDocumentTypeMeta(sale.document_type);
                const dueBadge = getDueDateBadge(sale);

                return (
                  <tr key={sale.id} className="hover:bg-muted/30 transition">
                    {/* Document Type & Reference */}
                    <td>
                      <div className="flex flex-col items-start gap-1">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${docMeta.color}`}>
                          {docMeta.icon} {docMeta.label}
                        </span>
                        <button
                          type="button"
                          className="font-mono text-xs font-black text-primary hover:underline flex items-center gap-1 text-left"
                          onClick={() => setViewerDoc(sale)}
                          title="Visualiser et imprimer ce document"
                        >
                          <span>{sale.reference}</span>
                          <Eye size={12} className="opacity-60" />
                        </button>
                      </div>
                    </td>

                    {/* Date & Smart Due Date */}
                    <td>
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-foreground block">
                          {formatDate(sale.sale_date, false)}
                        </span>
                        {dueBadge && (
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10.5px] border ${dueBadge.color}`}
                          >
                            {dueBadge.text}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Client & Sales Channel */}
                    <td>
                      <div>
                        <strong className="text-xs font-black text-foreground block">
                          {sale.client_name || "Client comptant"}
                        </strong>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          {sale.client_phone && (
                            <a
                              href={`https://api.whatsapp.com/send?phone=${sale.client_phone.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100 transition"
                              title="Ouvrir WhatsApp directement avec ce client"
                            >
                              <span>📱</span>
                              <span>{sale.client_phone}</span>
                            </a>
                          )}
                          {sale.sales_channel && (
                            <span className="text-[10px] font-semibold text-muted-foreground">
                              Canal : {sale.sales_channel}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Item label */}
                    <td>
                      <div className="space-y-0.5 max-w-[200px]">
                        <span className="text-xs font-bold text-foreground line-clamp-1">
                          {sale.item_label}
                        </span>
                        <small className="text-[10.5px] text-muted-foreground block">
                          Qté : {sale.quantity} × {formatMoney(sale.unit_price, sale.currency)}
                        </small>
                      </div>
                    </td>

                    {/* Settlement progress & Balance due */}
                    <td className="app-number">
                      <div className="flex flex-col items-end gap-1">
                        <strong className="text-xs font-black text-foreground">
                          {formatMoney(total, sale.currency)}
                        </strong>

                        {/* Visual Progress Bar */}
                        <div className="w-24 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              percentPaid === 100
                                ? "bg-emerald-500"
                                : percentPaid > 0
                                ? "bg-amber-500"
                                : "bg-transparent"
                            }`}
                            style={{ width: `${percentPaid}%` }}
                          />
                        </div>

                        <div className="text-[10.5px] text-muted-foreground">
                          {percentPaid === 100 ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ 100% Soldé</span>
                          ) : (
                            <span>
                              Encaissé : <strong>{formatMoney(paid, sale.currency)}</strong>
                              {balance > 0 && (
                                <span className="text-amber-600 dark:text-amber-400 block font-bold">
                                  Solde : {formatMoney(balance, sale.currency)}
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Action Buttons */}
                    <td style={{ textAlign: "center" }}>
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Open PDF / Printable Document */}
                        <button
                          type="button"
                          className="p-1.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                          onClick={() => setViewerDoc(sale)}
                          title="Imprimer / Télécharger en PDF / Partager"
                        >
                          <Printer size={13} className="text-muted-foreground" />
                          <span className="hidden sm:inline">Doc</span>
                        </button>

                        {/* Record Partial Payment (if not 100% paid) */}
                        {balance > 0 && (
                          <button
                            type="button"
                            className="px-2 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 text-xs font-black flex items-center gap-1 transition cursor-pointer border border-emerald-300 dark:border-emerald-800"
                            onClick={() => setPaymentSale(sale)}
                            title="Encaisser un acompte ou le solde restant"
                          >
                            <CreditCard size={13} />
                            <span>Acompte</span>
                          </button>
                        )}

                        {/* AI Payment Reminder */}
                        {sale.payment_status !== "paid" && (
                          <button
                            type="button"
                            className="p-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 text-xs font-bold transition cursor-pointer"
                            onClick={() => setReminderSale(sale)}
                            title="Relance IA WhatsApp / Email"
                          >
                            <Sparkles size={13} />
                          </button>
                        )}

                        {/* Edit */}
                        <button
                          type="button"
                          className="p-1.5 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground text-xs transition cursor-pointer"
                          onClick={() => onEdit(sale)}
                          title="Modifier"
                        >
                          <Pencil size={13} />
                        </button>

                        {/* Archive */}
                        <button
                          type="button"
                          className="p-1.5 rounded-xl border border-border bg-card hover:bg-red-50 hover:border-red-300 text-muted-foreground hover:text-red-600 text-xs transition cursor-pointer"
                          onClick={() => onArchive(sale.id)}
                          title="Archiver"
                        >
                          <Archive size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Printable Document Modal */}
      <CommercialDocumentViewer
        open={Boolean(viewerDoc)}
        onClose={() => setViewerDoc(null)}
        document={viewerDoc}
        organizationName={organizationName}
        organizationCategory={organizationCategory}
        onRecordPayment={(doc) => {
          setViewerDoc(null);
          setPaymentSale(doc);
        }}
        onConvert={handleConvert}
      />

      {/* Partial Payment Modal */}
      <RecordPaymentModal
        open={Boolean(paymentSale)}
        onClose={() => setPaymentSale(null)}
        sale={paymentSale}
        onPaymentRecorded={async () => {
          onRefresh();
        }}
      />

      {/* AI Payment Reminder Modal */}
      <PaymentReminderDialog
        open={Boolean(reminderSale)}
        onClose={() => setReminderSale(null)}
        sale={reminderSale}
      />
    </div>
  );
}

/* =========================================================================
   OFFERS TABLE INTERACTIVE
   ========================================================================= */
interface OffersTableInteractiveProps {
  offers: OfferItem[];
  onSelect: (offer: OfferItem) => void;
  onEdit: (offer: OfferItem) => void;
  onArchive: (id: string) => void;
  onAdjustStock?: (offer: OfferItem) => void;
}

export function OffersTableInteractive({
  offers,
  onSelect,
  onEdit,
  onArchive,
  onAdjustStock,
}: OffersTableInteractiveProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const categories = useMemo(() => {
    const set = new Set<string>();
    offers.forEach((o) => {
      if (o.category) set.add(o.category);
    });
    return ["all", ...Array.from(set)];
  }, [offers]);

  const filtered = useMemo(() => {
    return offers.filter((o) => {
      if (categoryFilter !== "all" && o.category !== categoryFilter) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        o.name.toLowerCase().includes(q) ||
        (o.category || "").toLowerCase().includes(q) ||
        (o.description || "").toLowerCase().includes(q) ||
        (o.conditions || "").toLowerCase().includes(q)
      );
    });
  }, [offers, query, categoryFilter]);

  return (
    <div className="kx-table-wrapper" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="kx-table-header-controls">
        <div className="kx-table-search-row">
          <label className="app-search kx-search-box">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("offers_search_placeholder")}
            />
          </label>

          <select
            className="app-select kx-filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">{t("common_all")}</option>
            {categories
              .filter((c) => c !== "all")
              .map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="app-table-scroll kx-rich-table-scroll rounded-2xl border border-border overflow-hidden">
        <table className="app-data-table kx-rich-table">
          <thead>
            <tr>
              <th>{t("offers_th_name")}</th>
              <th>{t("offers_th_category")}</th>
              <th className="app-number">{t("offers_th_price")}</th>
              <th className="app-number">{t("offers_th_cost")}</th>
              <th className="app-number">Marge brute</th>
              <th>{t("offers_th_stock")}</th>
              <th>{t("common_status")}</th>
              <th style={{ textAlign: "center" }}>{t("common_actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-muted-foreground text-sm">
                  {t("common_all")}
                </td>
              </tr>
            ) : (
              filtered.map((offer) => {
                const price = Number(offer.price || 0);
                const cost = offer.cost_price != null ? Number(offer.cost_price) : null;
                const margin = cost != null && price > 0 ? Math.round(((price - cost) / price) * 100) : null;
                const stock = Number(offer.stock_quantity || 0);
                const minStock = Number(offer.min_stock_alert || 5);
                const isLowStock = offer.track_stock && stock <= minStock;

                return (
                  <tr key={offer.id} className="hover:bg-muted/30 transition">
                    <td>
                      <div>
                        <strong className="text-xs font-black text-foreground block">{offer.name}</strong>
                        {offer.billing_unit && (
                          <span className="text-[10.5px] text-muted-foreground">Par {offer.billing_unit}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-muted text-muted-foreground">
                        {offer.category || "Général"}
                      </span>
                    </td>
                    <td className="app-number font-black text-foreground">
                      {formatMoney(offer.price, offer.currency)}
                    </td>
                    <td className="app-number text-muted-foreground font-medium">
                      {cost != null ? formatMoney(cost, offer.currency) : "—"}
                    </td>
                    <td className="app-number">
                      {margin != null ? (
                        <span
                          className={`text-xs font-black ${
                            margin >= 30 ? "text-emerald-600" : margin >= 15 ? "text-amber-600" : "text-red-600"
                          }`}
                        >
                          {margin}%
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      {offer.track_stock ? (
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-black ${
                              isLowStock
                                ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            }`}
                          >
                            {stock} {offer.billing_unit || "unités"}
                          </span>
                          {onAdjustStock && (
                            <button
                              type="button"
                              onClick={() => onAdjustStock(offer)}
                              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                              title="Ajuster le stock"
                            >
                              <RefreshCw size={12} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Non suivi</span>
                      )}
                    </td>
                    <td>
                      <StatusPill>{formatLabel(offer.status)}</StatusPill>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          className="p-1.5 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground text-xs transition cursor-pointer"
                          onClick={() => onEdit(offer)}
                          title="Modifier"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 rounded-xl border border-border bg-card hover:bg-red-50 hover:border-red-300 text-muted-foreground hover:text-red-600 text-xs transition cursor-pointer"
                          onClick={() => onArchive(offer.id)}
                          title="Archiver"
                        >
                          <Archive size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* =========================================================================
   PROCEDURES TABLE INTERACTIVE
   ========================================================================= */
interface ProceduresTableInteractiveProps {
  procedures: ProcedureItem[];
  onSelect: (proc: ProcedureItem) => void;
  onEdit: (proc: ProcedureItem) => void;
  onArchive: (id: string) => void;
}

export function ProceduresTableInteractive({
  procedures,
  onSelect,
  onEdit,
  onArchive,
}: ProceduresTableInteractiveProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");

  const departments = useMemo(() => {
    const set = new Set<string>();
    procedures.forEach((p) => {
      if (p.department) set.add(p.department);
    });
    return ["all", ...Array.from(set)];
  }, [procedures]);

  const filtered = useMemo(() => {
    return procedures.filter((p) => {
      if (deptFilter !== "all" && p.department !== deptFilter) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        (p.department || "").toLowerCase().includes(q) ||
        (p.objective || "").toLowerCase().includes(q) ||
        (p.responsible_user_id || "").toLowerCase().includes(q)
      );
    });
  }, [procedures, query, deptFilter]);

  return (
    <div className="kx-table-wrapper" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="kx-table-header-controls">
        <div className="kx-table-search-row">
          <label className="app-search kx-search-box">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("procedures_search_placeholder")}
            />
          </label>

          <div className="kx-filter-pills">
            {departments.map((dept) => (
              <button
                key={dept}
                type="button"
                className={`kx-pill-filter ${deptFilter === dept ? "is-active" : ""}`}
                onClick={() => setDeptFilter(dept)}
              >
                <span>{dept === "all" ? "Tous départements" : dept}</span>
                <small>{dept === "all" ? procedures.length : procedures.filter((p) => p.department === dept).length}</small>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="app-table-scroll kx-rich-table-scroll">
        <table className="app-data-table kx-rich-table">
          <thead>
            <tr>
              <th>Méthode / Procédure</th>
              <th>{t("procedures_th_category")}</th>
              <th>{t("procedures_th_role")}</th>
              <th>Version</th>
              <th>Prochaine Révision</th>
              <th>{t("common_status")}</th>
              <th style={{ textAlign: "center" }}>{t("common_actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((proc) => (
              <tr key={proc.id}>
                <td>
                  <strong
                    style={{ cursor: "pointer", color: "var(--kx-primary-color, #0f766e)" }}
                    onClick={() => onSelect(proc)}
                  >
                    {proc.title}
                  </strong>
                  {proc.objective && (
                    <div style={{ fontSize: "0.8rem", color: "var(--kx-text-muted)" }}>
                      {proc.objective}
                    </div>
                  )}
                </td>
                <td>
                  <span className="kx-method-tag">{proc.department || "Général"}</span>
                </td>
                <td>
                  <strong>{proc.responsible_user_id || "Non assigné"}</strong>
                </td>
                <td>v{proc.version}</td>
                <td>{formatDate(proc.next_review_date)}</td>
                <td>
                  <StatusPill>{formatLabel(proc.status)}</StatusPill>
                </td>
                <td style={{ textAlign: "center" }}>
                  <div className="kx-row-actions-group" style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                    <button
                      type="button"
                      className="app-button app-button-secondary"
                      style={{ padding: "4px 8px", fontSize: "0.8rem" }}
                      onClick={() => onEdit(proc)}
                      title="Modifier cette méthode"
                    >
                      <Pencil size={13} />
                      <span>Modifier</span>
                    </button>
                    <button
                      type="button"
                      className="app-button app-button-secondary"
                      style={{ padding: "4px 8px", fontSize: "0.8rem" }}
                      onClick={() => onSelect(proc)}
                      title="Voir le détail et les étapes"
                    >
                      <Eye size={13} />
                    </button>
                    <button
                      type="button"
                      className="app-button app-button-secondary"
                      style={{ padding: "4px 8px", color: "#ef4444" }}
                      onClick={() => onArchive(proc.id)}
                      title="Archiver cette méthode"
                    >
                      <Archive size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
