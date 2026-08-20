"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Plus,
  RefreshCw,
  TrendingDown,
  CheckCircle2,
  Clock,
  Building,
  Tag,
  FileText,
  Pencil,
  Trash2,
} from "lucide-react";
import { StatusPill } from "./Ui";
import { Dialog, FormError } from "./Dialog";
import { formatMoney, formatDate, formatLabel } from "./RegistersTable";
import { serviceIaFetch } from "@/lib/service-ia/api";

export interface ExpenseItem {
  id: string;
  reference: string;
  expense_date: string;
  category: string;
  beneficiary: string;
  amount: string | number;
  currency: string;
  payment_method?: string | null;
  payment_status: "paid" | "unpaid" | "partial" | "cancelled";
  invoice_number?: string | null;
  comment?: string | null;
  status: string;
  source: string;
  created_at?: string;
  updated_at?: string;
}

interface ExpensesTableProps {
  expenses: ExpenseItem[];
  onSelect: (expense: ExpenseItem) => void;
  onRefresh: () => void;
}

const CATEGORIES = [
  "Toutes",
  "Loyer",
  "Salaires",
  "Marchandises",
  "Énergie",
  "Transport",
  "Marketing",
  "Taxes",
  "Divers",
];

export function ExpensesTableInteractive({
  expenses,
  onSelect,
  onRefresh,
}: ExpensesTableProps) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Toutes");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid" | "partial">("all");
  const [sortField, setSortField] = useState<keyof ExpenseItem>("expense_date");
  const [sortAsc, setSortAsc] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredAndSorted = useMemo(() => {
    let result = [...expenses];

    if (categoryFilter !== "Toutes") {
      result = result.filter(
        (e) => (e.category || "Divers").toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((e) => e.payment_status === statusFilter);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter((e) =>
        [
          e.reference,
          e.beneficiary,
          e.category,
          e.invoice_number,
          e.comment,
          e.payment_method,
        ].some((v) => String(v || "").toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === "amount") {
        valA = Number(valA || 0);
        valB = Number(valB || 0);
      } else if (sortField === "expense_date") {
        valA = new Date(valA || 0).getTime();
        valB = new Date(valB || 0).getTime();
      } else {
        valA = String(valA || "").toLowerCase();
        valB = String(valB || "").toLowerCase();
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [expenses, categoryFilter, statusFilter, query, sortField, sortAsc]);

  const handleSort = (field: keyof ExpenseItem) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleQuickStatusChange = async (
    expenseId: string,
    newStatus: "paid" | "unpaid" | "partial"
  ) => {
    setUpdatingId(expenseId);
    try {
      await serviceIaFetch(`/registers/expenses/${expenseId}/payment-status`, {
        method: "PATCH",
        body: JSON.stringify({ payment_status: newStatus }),
      });
      onRefresh();
    } catch (e) {
      console.error("Failed to update expense payment status", e);
    } finally {
      setUpdatingId(null);
    }
  };

  const exportFilteredCsv = () => {
    const headers = [
      "Référence",
      "Date",
      "Catégorie",
      "Bénéficiaire/Fournisseur",
      "Montant",
      "Devise",
      "État Règlement",
      "Mode Paiement",
      "N° Facture",
      "Commentaire",
    ];

    const rows = filteredAndSorted.map((e) => [
      e.reference,
      e.expense_date,
      e.category,
      `"${(e.beneficiary || "").replaceAll('"', '""')}"`,
      e.amount,
      e.currency,
      formatLabel(e.payment_status),
      e.payment_method || "",
      e.invoice_number || "",
      `"${(e.comment || "").replaceAll('"', '""')}"`,
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `koryxa_depenses_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalAmount = useMemo(() => {
    return filteredAndSorted.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [filteredAndSorted]);

  const primaryCurrency = expenses[0]?.currency || "XOF";

  return (
    <div className="kx-table-wrapper">
      {/* Controls: Search, Filters & Export */}
      <div className="kx-table-header-controls">
        <div className="kx-table-search-row">
          <label className="app-search kx-search-box">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une dépense par référence, fournisseur, catégorie, facture…"
            />
          </label>

          <div className="kx-filter-pills">
            {(["all", "paid", "unpaid", "partial"] as const).map((st) => (
              <button
                key={st}
                type="button"
                className={`kx-pill-filter ${statusFilter === st ? "is-active" : ""}`}
                onClick={() => setStatusFilter(st)}
              >
                {st === "all"
                  ? "Toutes"
                  : st === "paid"
                  ? "Réglées"
                  : st === "unpaid"
                  ? "En attente"
                  : "Partielles"}
                <small>
                  {st === "all"
                    ? expenses.length
                    : expenses.filter((e) => e.payment_status === st).length}
                </small>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="app-button app-button-secondary kx-export-btn"
            onClick={exportFilteredCsv}
            title="Exporter les lignes affichées au format CSV"
          >
            <Download size={15} />
            <span>Exporter CSV</span>
          </button>
        </div>

        {/* Category Pills Bar */}
        <div className="kx-category-pills-bar">
          <span className="kx-filter-label">Catégorie :</span>
          <div className="kx-cat-scroll">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`kx-cat-pill ${categoryFilter === cat ? "is-active" : ""}`}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Totals Meta Bar */}
        <div className="kx-table-meta-bar">
          <span>
            {filteredAndSorted.length} dépense(s) affichée(s) sur {expenses.length}
          </span>
          <span className="kx-table-meta-sum">
            Total Dépenses : <strong>{formatMoney(totalAmount, primaryCurrency)}</strong>
          </span>
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="app-table-scroll">
        <table className="app-data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("reference")} className="kx-th-sortable">
                <div className="kx-th-inner">
                  <span>Réf. Dépense</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th onClick={() => handleSort("expense_date")} className="kx-th-sortable">
                <div className="kx-th-inner">
                  <span>Date</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th onClick={() => handleSort("category")} className="kx-th-sortable">
                <div className="kx-th-inner">
                  <span>Catégorie</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th onClick={() => handleSort("beneficiary")} className="kx-th-sortable">
                <div className="kx-th-inner">
                  <span>Fournisseur / Bénéficiaire</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th onClick={() => handleSort("amount")} className="kx-th-sortable app-number">
                <div className="kx-th-inner app-number">
                  <span>Montant</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th>État Règlement</th>
              <th>Mode Paiement</th>
              <th>N° Facture</th>
              <th>Commentaire</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.map((exp) => (
              <tr key={exp.id} onDoubleClick={() => onSelect(exp)}>
                <td>
                  <button className="app-table-link kx-code-badge" onClick={() => onSelect(exp)}>
                    {exp.reference}
                  </button>
                </td>
                <td className="kx-date-cell">{formatDate(exp.expense_date)}</td>
                <td>
                  <span className="kx-cat-tag">{exp.category || "Divers"}</span>
                </td>
                <td>
                  <span className="kx-client-name">{exp.beneficiary}</span>
                </td>
                <td className="app-number app-table-total" style={{ color: "#b91c1c" }}>
                  -{formatMoney(exp.amount, exp.currency)}
                </td>
                <td>
                  <div className="kx-inline-status-toggle">
                    <select
                      value={exp.payment_status}
                      disabled={updatingId === exp.id}
                      onChange={(e) =>
                        handleQuickStatusChange(
                          exp.id,
                          e.target.value as "paid" | "unpaid" | "partial"
                        )
                      }
                      className={`kx-status-select kx-status-${exp.payment_status}`}
                    >
                      <option value="paid">Réglé</option>
                      <option value="unpaid">En attente</option>
                      <option value="partial">Partiel</option>
                    </select>
                  </div>
                </td>
                <td>
                  {exp.payment_method ? (
                    <span className="kx-method-tag">{exp.payment_method}</span>
                  ) : (
                    <span className="kx-muted-tag">—</span>
                  )}
                </td>
                <td className="kx-invoice-cell">{exp.invoice_number || "—"}</td>
                <td className="app-table-comment">{exp.comment || "—"}</td>
                <td>
                  <button
                    type="button"
                    className="kx-row-inspect-btn"
                    onClick={() => onSelect(exp)}
                  >
                    Détails
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ExpenseCreateDialog({
  open,
  onClose,
  onCreated,
  expense,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  expense?: ExpenseItem | null;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState(expense?.reference || "");
  const [loadingRef, setLoadingRef] = useState(false);
  const [docType, setDocType] = useState<string>("expense_receipt");
  const [paymentStatus, setPaymentStatus] = useState<string>(expense?.payment_status || "paid");
  const [dueDate, setDueDate] = useState<string>("");

  useEffect(() => {
    if (open && !expense && !reference) {
      setLoadingRef(true);
      serviceIaFetch<{ reference: string }>("/registers/generate-reference?type=expense")
        .then((res) => {
          if (res?.reference) setReference(res.reference);
        })
        .catch(() => {})
        .finally(() => setLoadingRef(false));
    }
  }, [open, expense, reference]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const payload = {
        reference: reference.trim() || undefined,
        document_type: docType,
        expense_date: String(form.get("expense_date") || new Date().toISOString().slice(0, 10)),
        due_date: dueDate || null,
        category: String(form.get("category") || "Divers"),
        beneficiary: String(form.get("beneficiary") || ""),
        amount: Number(form.get("amount") || 0),
        currency: String(form.get("currency") || "XOF"),
        payment_method: String(form.get("payment_method") || "") || null,
        payment_status: paymentStatus,
        invoice_number: String(form.get("invoice_number") || "") || null,
        comment: String(form.get("comment") || "") || null,
      };

      await serviceIaFetch(`/registers/expenses${expense ? `/${expense.id}` : ""}`, {
        method: expense ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création de la dépense");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog
      open
      title={expense ? `Modifier ${expense.reference}` : "Enregistrer une Dépense / Achat"}
      description="Ajoutez une facture fournisseur, un achat de stock, loyer ou décaissement."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <div className="app-form-grid">
          {/* Reference Auto-generated */}
          <label>
            Référence auto-générée *
            <div className="flex items-center gap-1.5 mt-0.5">
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                required
                className="font-black tracking-wide"
                placeholder={loadingRef ? "Génération..." : "Ex: DEP-2026-001"}
              />
              <button
                type="button"
                onClick={() => {
                  setLoadingRef(true);
                  serviceIaFetch<{ reference: string }>("/registers/generate-reference?type=expense")
                    .then((res) => {
                      if (res?.reference) setReference(res.reference);
                    })
                    .catch(() => {})
                    .finally(() => setLoadingRef(false));
                }}
                className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground cursor-pointer"
                title="Régénérer une nouvelle référence"
              >
                <RefreshCw size={14} className={loadingRef ? "animate-spin" : ""} />
              </button>
            </div>
          </label>

          <label>
            Date de dépense *
            <input
              name="expense_date"
              type="date"
              required
              defaultValue={expense?.expense_date || new Date().toISOString().slice(0, 10)}
            />
          </label>

          <label>
            Catégorie *
            <select name="category" required defaultValue={expense?.category || "Marchandises"}>
              <option value="Marchandises">Achats & Marchandises</option>
              <option value="Loyer">Loyer & Locaux</option>
              <option value="Salaires">Salaires & Rémunérations</option>
              <option value="Énergie">Énergie & Eau</option>
              <option value="Transport">Transport & Logistique</option>
              <option value="Marketing">Marketing & Publicité</option>
              <option value="Taxes">Taxes & Impôts</option>
              <option value="Divers">Divers / Autre</option>
            </select>
          </label>

          <label>
            Fournisseur / Bénéficiaire *
            <input
              name="beneficiary"
              required
              defaultValue={expense?.beneficiary || ""}
              placeholder="Ex : Sodeci, Bailleur Immobilier, Société ABC…"
            />
          </label>

          <label>
            Montant *
            <input
              name="amount"
              type="number"
              step="any"
              min="1"
              required
              placeholder="Ex : 50000"
              defaultValue={expense?.amount || ""}
            />
          </label>

          <label>
            Devise
            <select name="currency" defaultValue={expense?.currency || "XOF"}>
              <option value="XOF">FCFA (XOF)</option>
              <option value="EUR">Euro (€)</option>
              <option value="USD">Dollar ($)</option>
            </select>
          </label>

          <label>
            État du règlement
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
            >
              <option value="paid">Payé / Réglé (Comptant)</option>
              <option value="unpaid">En attente / Non payé</option>
              <option value="partial">Partiel (Acompte versé)</option>
            </select>
          </label>

          {paymentStatus !== "paid" && (
            <label>
              Date d&apos;échéance de paiement
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="Date limite"
              />
            </label>
          )}

          <label>
            Mode de paiement
            <input
              name="payment_method"
              placeholder="Ex : Wave, Virement, Espèces…"
              defaultValue={expense?.payment_method || ""}
            />
          </label>

          <label className="app-form-span">
            N° de Facture Fournisseur / Justificatif
            <input
              name="invoice_number"
              placeholder="Ex : FAC-FOURN-089"
              defaultValue={expense?.invoice_number || ""}
            />
          </label>

          <label className="app-form-span">
            Commentaire
            <textarea
              name="comment"
              placeholder="Précisions sur cet achat / facture…"
              defaultValue={expense?.comment || ""}
            />
          </label>
        </div>

        <FormError>{error}</FormError>

        <div className="app-form-actions">
          <button type="button" className="app-button app-button-secondary" onClick={onClose}>
            Annuler
          </button>
          <button className="app-button app-button-primary" disabled={saving}>
            {saving ? "Enregistrement…" : expense ? "Enregistrer les modifications" : "Enregistrer la dépense"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

export function ExpenseDetailsDialog({
  expense,
  onClose,
  onEdit,
  onDeleted,
}: {
  expense: ExpenseItem | null;
  onClose: () => void;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  if (!expense) return null;

  return (
    <Dialog
      open
      title={`Dépense ${expense.reference}`}
      description="Détail complet de la pièce justificative et du règlement."
      onClose={onClose}
    >
      <div className="app-sale-summary" style={{ background: "linear-gradient(135deg,#fff1f0,#fcf8f8)" }}>
        <div>
          <span>Montant Décaissé</span>
          <strong style={{ color: "#991b1b" }}>
            -{formatMoney(expense.amount, expense.currency)}
          </strong>
        </div>
        <StatusPill>{formatLabel(expense.payment_status)}</StatusPill>
      </div>

      <div className="app-detail-grid">
        <div>
          <span>Date</span>
          <strong>{formatDate(expense.expense_date)}</strong>
        </div>
        <div>
          <span>Catégorie</span>
          <strong>{expense.category}</strong>
        </div>
        <div>
          <span>Fournisseur / Bénéficiaire</span>
          <strong>{expense.beneficiary}</strong>
        </div>
        <div>
          <span>Mode de paiement</span>
          <strong>{expense.payment_method || "Non renseigné"}</strong>
        </div>
        <div>
          <span>N° de Facture</span>
          <strong>{expense.invoice_number || "Non renseigné"}</strong>
        </div>
        <div>
          <span>Source</span>
          <strong>{formatLabel(expense.source)}</strong>
        </div>
      </div>

      {expense.comment && (
        <div className="app-detail-comment">
          <span>Commentaire</span>
          <p>{expense.comment}</p>
        </div>
      )}

      <div className="app-form-actions">
        <button className="app-button app-button-secondary" onClick={async () => { if (!window.confirm("Supprimer définitivement cette dépense ?")) return; await serviceIaFetch(`/registers/expenses/${expense.id}`, { method: "DELETE" }); onClose(); onDeleted(); }}><Trash2 size={15}/>Supprimer</button>
        <button className="app-button app-button-secondary" onClick={onClose}>Fermer</button>
        <button className="app-button app-button-primary" onClick={onEdit}><Pencil size={15}/>Modifier</button>
      </div>
    </Dialog>
  );
}
