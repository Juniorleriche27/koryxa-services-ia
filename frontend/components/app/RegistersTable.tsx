"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";
import { StatusPill } from "./Ui";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { PaymentReminderDialog } from "./PaymentReminderDialog";

export interface SaleItem {
  id: string;
  reference: string;
  sale_date: string;
  client_name?: string | null;
  offer_id?: string | null;
  item_label: string;
  quantity: string;
  unit_price: string;
  discount: string;
  total_amount: string;
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

export function formatDate(val: string | null | undefined) {
  if (!val) return "—";
  try {
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return String(val);
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
  };
  const key = String(value).toLowerCase();
  return translations[key] ?? String(value).replaceAll("_", " ");
}

/* =========================================================================
   SALES TABLE INTERACTIVE
   ========================================================================= */
interface SalesTableInteractiveProps {
  sales: SaleItem[];
  onSelect: (sale: SaleItem) => void;
  onEdit: (sale: SaleItem) => void;
  onArchive: (id: string) => void;
  onRefresh: () => void;
}

export function SalesTableInteractive({
  sales,
  onSelect,
  onEdit,
  onArchive,
  onRefresh,
}: SalesTableInteractiveProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof SaleItem>("sale_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [reminderSale, setReminderSale] = useState<SaleItem | null>(null);

  const handleSort = (field: keyof SaleItem) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const handleQuickPaymentStatus = async (
    sale: SaleItem,
    newStatus: "paid" | "unpaid" | "partial"
  ) => {
    setUpdatingId(sale.id);
    try {
      await serviceIaFetch(`/registers/sales/${sale.id}/payment-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_status: newStatus }),
      });
      onRefresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur de mise à jour");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredSales = useMemo(() => {
    return sales
      .filter((s) => {
        if (statusFilter !== "all" && s.payment_status !== statusFilter) return false;
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
  }, [sales, query, statusFilter, sortField, sortOrder]);

  const exportFilteredCsv = () => {
    const headers = [
      "Référence",
      "Date",
      "Client",
      "Article / Service",
      "Quantité",
      "Prix unitaire",
      "Montant total",
      "Devise",
      "État du paiement",
      "Mode de paiement",
      "Canal",
    ];
    const rows = filteredSales.map((s) => [
      `"${s.reference}"`,
      `"${s.sale_date}"`,
      `"${s.client_name || ""}"`,
      `"${s.item_label}"`,
      s.quantity,
      s.unit_price,
      s.total_amount,
      s.currency,
      s.payment_status,
      `"${s.payment_method || ""}"`,
      `"${s.sales_channel || ""}"`,
    ]);
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
    return filteredSales
      .filter((s) => s.payment_status === "paid")
      .reduce((acc, s) => acc + (Number(s.total_amount) || 0), 0);
  }, [filteredSales]);

  const unpaidAmount = useMemo(() => {
    return filteredSales
      .filter((s) => s.payment_status === "unpaid" || s.payment_status === "partial")
      .reduce((acc, s) => acc + (Number(s.total_amount) || 0), 0);
  }, [filteredSales]);

  const recoveryRate = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 100;
  const currency = sales[0]?.currency || "XOF";

  return (
    <div className="kx-table-wrapper" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Live KPIs Header */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <div style={{ background: "var(--kx-surface-raised, #f8fafc)", padding: "12px 16px", borderRadius: 10, border: "1px solid var(--kx-border-subtle, #e2e8f0)" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--kx-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Ventes</span>
          <div style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: 4 }}>{formatMoney(totalAmount, currency)}</div>
          <small style={{ color: "var(--kx-text-muted)" }}>{filteredSales.length} opérations</small>
        </div>

        <div style={{ background: "#f0fdf4", padding: "12px 16px", borderRadius: 10, border: "1px solid #bbf7d0" }}>
          <span style={{ fontSize: "0.75rem", color: "#166534", textTransform: "uppercase", letterSpacing: "0.05em" }}>Encaissé Réel</span>
          <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#15803d", marginTop: 4 }}>{formatMoney(paidAmount, currency)}</div>
          <small style={{ color: "#166534" }}>{recoveryRate}% du total facturé</small>
        </div>

        <div style={{ background: unpaidAmount > 0 ? "#fef2f2" : "var(--kx-surface-raised, #f8fafc)", padding: "12px 16px", borderRadius: 10, border: `1px solid ${unpaidAmount > 0 ? "#fecaca" : "var(--kx-border-subtle, #e2e8f0)"}` }}>
          <span style={{ fontSize: "0.75rem", color: unpaidAmount > 0 ? "#991b1b" : "var(--kx-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Reste à Recouvrer</span>
          <div style={{ fontSize: "1.25rem", fontWeight: 700, color: unpaidAmount > 0 ? "#dc2626" : "inherit", marginTop: 4 }}>{formatMoney(unpaidAmount, currency)}</div>
          <small style={{ color: unpaidAmount > 0 ? "#991b1b" : "var(--kx-text-muted)" }}>{filteredSales.filter((s) => s.payment_status !== "paid").length} créance(s)</small>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="kx-table-header-controls">
        <div className="kx-table-search-row">
          <label className="app-search kx-search-box">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher par référence, client, article, mode..."
            />
          </label>

          <div className="kx-filter-pills">
            {[
              { id: "all", label: "Toutes", count: sales.length },
              { id: "paid", label: "Payées", count: sales.filter((s) => s.payment_status === "paid").length },
              { id: "unpaid", label: "Non payées", count: sales.filter((s) => s.payment_status === "unpaid").length },
              { id: "partial", label: "Partielles", count: sales.filter((s) => s.payment_status === "partial").length },
            ].map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={`kx-pill-filter ${statusFilter === filter.id ? "is-active" : ""}`}
                onClick={() => setStatusFilter(filter.id)}
              >
                <span>{filter.label}</span>
                <small>{filter.count}</small>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="app-button app-button-secondary kx-export-btn"
            onClick={exportFilteredCsv}
            title="Exporter en CSV"
          >
            <Download size={15} />
            <span>Exporter ({filteredSales.length})</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="app-table-scroll kx-rich-table-scroll">
        <table className="app-data-table kx-rich-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("reference")} className="kx-th-sortable">
                <div className="kx-th-inner">
                  <span>Référence</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th onClick={() => handleSort("sale_date")} className="kx-th-sortable">
                <div className="kx-th-inner">
                  <span>Date</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th onClick={() => handleSort("client_name")} className="kx-th-sortable">
                <div className="kx-th-inner">
                  <span>Client</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th>Offre / Article</th>
              <th onClick={() => handleSort("quantity")} className="kx-th-sortable app-number">
                <div className="kx-th-inner app-number">
                  <span>Qté</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th onClick={() => handleSort("unit_price")} className="kx-th-sortable app-number">
                <div className="kx-th-inner app-number">
                  <span>Prix unitaire</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th onClick={() => handleSort("total_amount")} className="kx-th-sortable app-number">
                <div className="kx-th-inner app-number">
                  <span>Total</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th>État Paiement</th>
              <th>Mode</th>
              <th style={{ textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.map((sale) => (
              <tr key={sale.id}>
                <td>
                  <button
                    className="app-table-link kx-code-badge"
                    onClick={() => onSelect(sale)}
                    title="Voir la fiche complète"
                  >
                    {sale.reference}
                  </button>
                </td>
                <td>
                  <span className="kx-date-cell">{formatDate(sale.sale_date)}</span>
                </td>
                <td>
                  {sale.client_name ? (
                    <strong className="kx-client-name">{sale.client_name}</strong>
                  ) : (
                    <span className="kx-missing-pill">Non renseigné</span>
                  )}
                </td>
                <td>
                  <div className="kx-item-cell">
                    <span>{sale.item_label}</span>
                    {sale.comment && <small title={sale.comment}>{sale.comment}</small>}
                  </div>
                </td>
                <td className="app-number">
                  {new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(
                    Number(sale.quantity)
                  )}
                </td>
                <td className="app-number">{formatMoney(sale.unit_price, sale.currency)}</td>
                <td className="app-number app-table-total">
                  {formatMoney(sale.total_amount, sale.currency)}
                </td>
                <td>
                  <div className="kx-inline-status-toggle">
                    <select
                      className={`kx-status-select kx-status-${sale.payment_status}`}
                      value={sale.payment_status}
                      disabled={updatingId === sale.id}
                      onChange={(e) =>
                        handleQuickPaymentStatus(
                          sale,
                          e.target.value as "paid" | "unpaid" | "partial"
                        )
                      }
                      title="Changer rapidement le statut"
                    >
                      <option value="unpaid">Non payé</option>
                      <option value="partial">Partiel</option>
                      <option value="paid">Payé</option>
                      <option value="cancelled">Annulé</option>
                    </select>
                  </div>
                </td>
                <td>
                  <span className="kx-method-tag">{formatLabel(sale.payment_method || "—")}</span>
                </td>
                <td style={{ textAlign: "center" }}>
                  <div className="kx-row-actions-group" style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                    <button
                      type="button"
                      className="app-button app-button-secondary"
                      style={{ padding: "4px 8px", fontSize: "0.8rem" }}
                      onClick={() => onEdit(sale)}
                      title="Modifier les informations de cette vente"
                    >
                      <Pencil size={13} />
                      <span>Modifier</span>
                    </button>

                    {sale.payment_status !== "paid" && (
                      <button
                        type="button"
                        className="kx-row-ai-reminder-btn"
                        style={{ padding: "4px 8px" }}
                        onClick={() => setReminderSale(sale)}
                        title="Relance IA WhatsApp / Email"
                      >
                        <Sparkles size={13} />
                      </button>
                    )}

                    <button
                      type="button"
                      className="app-button app-button-secondary"
                      style={{ padding: "4px 8px", fontSize: "0.8rem" }}
                      onClick={() => onSelect(sale)}
                      title="Voir la fiche détaillée et l'historique"
                    >
                      <Eye size={13} />
                    </button>

                    <button
                      type="button"
                      className="app-button app-button-secondary"
                      style={{ padding: "4px 8px", color: "#ef4444" }}
                      onClick={() => onArchive(sale.id)}
                      title="Archiver cette vente"
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
              placeholder="Rechercher un produit, article, offre, tarif..."
            />
          </label>

          <div className="kx-filter-pills">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`kx-pill-filter ${categoryFilter === cat ? "is-active" : ""}`}
                onClick={() => setCategoryFilter(cat)}
              >
                <span>{cat === "all" ? "Toutes les catégories" : cat}</span>
                <small>{cat === "all" ? offers.length : offers.filter((o) => o.category === cat).length}</small>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="app-table-scroll kx-rich-table-scroll">
        <table className="app-data-table kx-rich-table">
          <thead>
            <tr>
              <th>Article / Produit / Offre</th>
              <th>Catégorie</th>
              <th className="app-number">Prix de Vente</th>
              <th>Stock Physique</th>
              <th>Unité</th>
              <th>Statut</th>
              <th style={{ textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((offer) => {
              const stock = Number(offer.stock_quantity ?? 0);
              const minStock = Number(offer.min_stock_alert ?? 5);
              const isOutOfStock = offer.track_stock && stock <= 0;
              const isLowStock = offer.track_stock && stock > 0 && stock <= minStock;

              return (
                <tr key={offer.id}>
                  <td>
                    <strong
                      style={{ cursor: "pointer", color: "var(--kx-primary-color, #0f766e)" }}
                      onClick={() => onSelect(offer)}
                    >
                      {offer.name}
                    </strong>
                    {offer.description && (
                      <div style={{ fontSize: "0.8rem", color: "var(--kx-text-muted)" }}>
                        {offer.description}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="kx-method-tag">{offer.category || "Général"}</span>
                  </td>
                  <td className="app-number app-table-total">
                    {formatMoney(offer.price, offer.currency)}
                    {offer.cost_price && (
                      <div style={{ fontSize: "0.75rem", color: "var(--kx-text-muted)", fontWeight: "normal" }}>
                        Coût : {formatMoney(offer.cost_price, offer.currency)}
                      </div>
                    )}
                  </td>
                  <td>
                    {offer.track_stock ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            isOutOfStock
                              ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                              : isLowStock
                              ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                          }`}
                        >
                          {isOutOfStock
                            ? "⛔ Rupture"
                            : isLowStock
                            ? `⚠️ Faible (${stock})`
                            : `✓ ${stock} en stock`}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: "var(--kx-text-muted)", fontSize: "0.8rem" }}>
                        Non suivi
                      </span>
                    )}
                  </td>
                  <td>{offer.billing_unit || "Unité"}</td>
                  <td>
                    <StatusPill>{formatLabel(offer.status)}</StatusPill>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <div className="kx-row-actions-group" style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                      {offer.track_stock && onAdjustStock && (
                        <button
                          type="button"
                          className="app-button app-button-secondary"
                          style={{ padding: "4px 8px", fontSize: "0.8rem" }}
                          onClick={() => onAdjustStock(offer)}
                          title="Ajuster le stock (Réapprovisionnement / Inventaire)"
                        >
                          <Package size={13} />
                          <span>Stock</span>
                        </button>
                      )}
                      <button
                        type="button"
                        className="app-button app-button-secondary"
                        style={{ padding: "4px 8px", fontSize: "0.8rem" }}
                        onClick={() => onEdit(offer)}
                        title="Modifier cet article"
                      >
                        <Pencil size={13} />
                        <span>Modifier</span>
                      </button>
                      <button
                        type="button"
                        className="app-button app-button-secondary"
                        style={{ padding: "4px 8px", fontSize: "0.8rem" }}
                        onClick={() => onSelect(offer)}
                        title="Voir le détail"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        type="button"
                        className="app-button app-button-secondary"
                        style={{ padding: "4px 8px", color: "#ef4444" }}
                        onClick={() => onArchive(offer.id)}
                        title="Archiver"
                      >
                        <Archive size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
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
              placeholder="Rechercher une méthode, un département, un responsable..."
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
              <th>Département</th>
              <th>Responsable</th>
              <th>Version</th>
              <th>Prochaine Révision</th>
              <th>Statut</th>
              <th style={{ textAlign: "center" }}>Actions</th>
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
