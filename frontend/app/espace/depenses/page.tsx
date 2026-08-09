"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/Ui";
import { serviceIaFetch } from "@/lib/service-ia/api";
import {
  ExpensesTableInteractive,
  ExpenseCreateDialog,
  ExpenseDetailsDialog,
  ExpenseItem,
} from "@/components/app/ExpensesTable";

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
  const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(null);

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
          <button className="app-button app-button-primary" onClick={() => setCreating(true)}>
            <Plus size={16} />
            <span>Ajouter une Dépense</span>
          </button>
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

      <ExpenseDetailsDialog
        expense={selectedExpense}
        onClose={() => setSelectedExpense(null)}
      />
    </>
  );
}
