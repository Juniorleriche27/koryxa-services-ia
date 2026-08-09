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
  status: string;
  effective_from?: string | null;
  expires_at?: string | null;
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
}

export function formatMoney(value: string | number | null | undefined, currency = "XOF") {
  if (value == null || value === "") return "Sur devis";
  const num = Number(value);
  return Number.isFinite(num)
    ? `${new Intl.NumberFormat("fr-FR").format(num)} ${currency}`
    : `${value} ${currency}`;
}

export function formatDate(value?: string | null) {
  return value ? new Intl.DateTimeFormat("fr-FR").format(new Date(value)) : "—";
}

export function formatLabel(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  const translations: Record<string, string> = {
    unpaid: "Non payé",
    partial: "Partiellement payé",
    paid: "Payé",
    cancelled: "Annulé",
    refunded: "Remboursé",
    draft: "Brouillon",
    to_verify: "À vérifier",
    validated: "Validé",
    obsolete: "Obsolète",
    archived: "Archivé",
    conflict: "En conflit",
    manual: "Saisie manuelle",
    excel: "Excel",
    document: "Document",
    voice: "Voix",
    photo: "Photo",
    integration: "Intégration",
    ai: "IA",
  };
  const key = String(value).toLowerCase();
  return translations[key] ?? String(value).replaceAll("_", " ");
}

interface SalesTableInteractiveProps {
  sales: SaleItem[];
  onSelect: (sale: SaleItem) => void;
  onRefresh: () => void;
}

export function SalesTableInteractive({
  sales,
  onSelect,
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
        body: JSON.stringify({ payment_status: newStatus }),
      });
      onRefresh();
    } catch (e) {
      console.error(e);
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
        const valA = a[sortField] ?? "";
        const valB = b[sortField] ?? "";
        if (sortField === "total_amount" || sortField === "unit_price" || sortField === "quantity") {
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

  const totalFilteredAmount = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + (Number(s.total_amount) || 0), 0);
  }, [filteredSales]);

  return (
    <div className="kx-table-wrapper">
      <div className="kx-table-header-controls">
        <div className="kx-table-search-row">
          <label className="app-search kx-search-box">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher par référence, client, article ou mode de paiement…"
            />
          </label>

          <div className="kx-filter-pills">
            {[
              { id: "all", label: "Toutes les ventes", count: sales.length },
              {
                id: "paid",
                label: "Payées",
                count: sales.filter((s) => s.payment_status === "paid").length,
              },
              {
                id: "unpaid",
                label: "Non payées",
                count: sales.filter((s) => s.payment_status === "unpaid").length,
              },
              {
                id: "partial",
                label: "Partielles",
                count: sales.filter((s) => s.payment_status === "partial").length,
              },
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
            title="Exporter la vue actuelle en CSV"
          >
            <Download size={15} />
            <span>Exporter CSV ({filteredSales.length})</span>
          </button>
        </div>

        <div className="kx-table-meta-bar">
          <span>
            Affichage de <strong>{filteredSales.length}</strong> sur <strong>{sales.length}</strong> ventes
          </span>
          <span className="kx-table-meta-sum">
            Total filtré : <strong>{new Intl.NumberFormat("fr-FR").format(totalFilteredAmount)} {sales[0]?.currency || "XOF"}</strong>
          </span>
        </div>
      </div>

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
              <th>Paiement</th>
              <th>Mode</th>
              <th>Canal</th>
              <th style={{ textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.map((sale) => (
              <tr key={sale.id} onDoubleClick={() => onSelect(sale)}>
                <td>
                  <button
                    className="app-table-link kx-code-badge"
                    onClick={() => onSelect(sale)}
                    title="Voir la fiche complète de la vente"
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
                    <span className="kx-missing-pill">Client non renseigné</span>
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
                      title="Changer rapidement le statut de paiement"
                    >
                      <option value="unpaid">Non payé</option>
                      <option value="partial">Partiellement payé</option>
                      <option value="paid">Payé</option>
                      <option value="cancelled">Annulé</option>
                    </select>
                  </div>
                </td>
                <td>
                  {sale.payment_method ? (
                    <span className="kx-method-tag">{sale.payment_method}</span>
                  ) : (
                    <span className="kx-muted-tag">—</span>
                  )}
                </td>
                <td>
                  <span className="kx-channel-tag">{formatLabel(sale.sales_channel || "Comptoir")}</span>
                </td>
                <td style={{ textAlign: "center" }}>
                  <div className="kx-row-actions-group">
                    {sale.payment_status !== "paid" && (
                      <button
                        type="button"
                        className="kx-row-ai-reminder-btn"
                        onClick={() => setReminderSale(sale)}
                        title="Générer une relance de paiement intelligente (WhatsApp / Email)"
                      >
                        <Sparkles size={13} />
                        <span>Relance IA</span>
                      </button>
                    )}
                    <button
                      className="kx-row-inspect-btn"
                      onClick={() => onSelect(sale)}
                      title="Inspecter le détail"
                    >
                      <Eye size={15} />
                      <span>Détail</span>
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

