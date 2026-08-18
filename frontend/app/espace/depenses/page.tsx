"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Camera } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/Ui";
import { serviceIaFetch } from "@/lib/service-ia/api";
import {
  ExpensesTableInteractive,
  ExpenseCreateDialog,
  ExpenseDetailsDialog,
  ExpenseItem,
} from "@/components/app/ExpensesTable";
import { ReceiptOcrModal } from "@/components/app/ReceiptOcrModal";

interface ApiPage<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [ocrOpen, setOcrOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await serviceIaFetch<ApiPage<ExpenseItem>>("/registers/expenses?page_size=100");
      setExpenses(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Données indisponibles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadExpenses();
  }, [loadExpenses]);

  return (
    <>
      <PageHeader
        eyebrow="Trésorerie & Achats"
        title="Dépenses & Décaissements"
        description="Suivez vos sorties d'argent par catégorie, contrôlez vos factures fournisseurs et anticipez vos règlements."
        action={
          <div className="kx-header-actions-row" style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => setOcrOpen(true)}
              title="Scanner une facture ou un reçu avec l'IA"
            >
              <Camera size={16} />
              <span>Scanner reçu (OCR)</span>
            </button>
            <button className="app-button app-button-primary" onClick={() => setCreating(true)}>
              <Plus size={16} />
              <span>Ajouter une Dépense</span>
            </button>
          </div>
        }
      />

      <section className="app-panel">
        {loading && <EmptyState title="Chargement…" detail="Connexion aux dépenses réelles." />}
        {error && <EmptyState title="Erreur" detail={error} />}
        {!loading && !error && expenses.length === 0 && (
          <EmptyState
            title="Aucune dépense enregistrée"
            detail="Enregistrez vos factures fournisseurs, loyers et achats pour suivre votre trésorerie nette."
          />
        )}

        {!loading && !error && expenses.length > 0 && (
          <ExpensesTableInteractive
            expenses={expenses}
            onSelect={setSelectedExpense}
            onRefresh={loadExpenses}
          />
        )}
      </section>

      <ExpenseCreateDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={loadExpenses}
      />
      <ExpenseCreateDialog
        key={editingExpense?.id || "no-expense-edit"}
        open={Boolean(editingExpense)}
        expense={editingExpense}
        onClose={() => setEditingExpense(null)}
        onCreated={loadExpenses}
      />

      <ExpenseDetailsDialog
        expense={selectedExpense}
        onClose={() => setSelectedExpense(null)}
        onEdit={() => { setEditingExpense(selectedExpense); setSelectedExpense(null); }}
        onDeleted={loadExpenses}
      />

      <ReceiptOcrModal
        open={ocrOpen}
        onClose={() => setOcrOpen(false)}
        onExpenseCreated={loadExpenses}
      />
    </>
  );
}
