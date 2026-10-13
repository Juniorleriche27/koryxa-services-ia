"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { serviceIaFetch } from "@/lib/service-ia/api";

type Account = {
  account_id: string;
  name: string;
  currency: string;
  opening_date: string | null;
  opening_balance: string | null;
  recorded_inflows: string;
  recorded_outflows: string;
  balance: string | null;
  status: string;
  reconciliation_status: string;
};
type ExpenseChoice = { id: string; reference: string; title?: string; amount: number | string; currency?: string };
type Coverage = { expense_count: number; classified_count: number; unclassified_count: number; gross_margin: null; break_even_point: null; reason: string };
const field = "w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 dark:border-slate-600 dark:bg-slate-900 dark:text-white";
const button = "rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60";

export default function FinancePage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [coverage, setCoverage] = useState<Coverage | null>(null);
  const [expenses, setExpenses] = useState<ExpenseChoice[]>([]);
  const [expenseId, setExpenseId] = useState("");
  const [behavior, setBehavior] = useState<"fixed" | "variable" | "unknown">("unknown");
  const [relation, setRelation] = useState<"direct" | "indirect" | "unknown">("unknown");
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [targetAccountId, setTargetAccountId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("XOF");
  const [openingBalance, setOpeningBalance] = useState("");
  const [openingDate, setOpeningDate] = useState("");
  const [existingAccountOpeningId, setExistingAccountOpeningId] = useState("");
  const [verifiedOpeningBalance, setVerifiedOpeningBalance] = useState("");
  const [verifiedOpeningDate, setVerifiedOpeningDate] = useState("");
  const [accountId, setAccountId] = useState("");
  const [movementDate, setMovementDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [category, setCategory] = useState("other");
  const [note, setNote] = useState("");

  const reload = useCallback(async () => {
    const [a, c, expensePage] = await Promise.all([
      serviceIaFetch<Account[]>("/finance/accounts"),
      serviceIaFetch<Coverage>("/finance/cost-coverage"),
      serviceIaFetch<{items: ExpenseChoice[]}>("/registers/expenses?page_size=100"),
    ]);
    setAccounts(a);
    setExistingAccountOpeningId((previous) => previous || a.find((item) => !item.opening_date)?.account_id || "");
    setCoverage(c);
    setExpenses(expensePage.items);
    setExpenseId((previous) => previous || expensePage.items[0]?.id || "");
    setSourceAccountId((previous) => previous || a[0]?.account_id || "");
    setTargetAccountId((previous) => previous || a[1]?.account_id || "");
    setAccountId((previous) => previous || a[0]?.account_id || "");
  }, []);

  useEffect(() => { void reload().catch((e: unknown) => setError(e instanceof Error ? e.message : "Chargement impossible")); }, [reload]);

  const submit = async (job: () => Promise<unknown>, success: string) => {
    setBusy(true); setError(""); setNotice("");
    try { await job(); await reload(); setNotice(success); }
    catch (e) { setError(e instanceof Error ? e.message : "Enregistrement impossible"); }
    finally { setBusy(false); }
  };

  const createAccount = (e: FormEvent) => {
    e.preventDefault();
    void submit(async () => {
      await serviceIaFetch("/finance/accounts", {
        method: "POST",
        body: JSON.stringify({ name, currency, opening_balance: openingBalance === "" ? null : openingBalance, opening_date: openingDate || null }),
      });
      setName(""); setOpeningBalance(""); setOpeningDate("");
    }, "Compte enregistré. Le solde reste non rapproché de la banque.");
  };

  const createMovement = (e: FormEvent) => {
    e.preventDefault();
    void submit(async () => {
      await serviceIaFetch("/finance/movements", {
        method: "POST",
        body: JSON.stringify({ account_id: accountId, occurred_on: movementDate, amount, direction, category, note: note || null }),
      });
      setAmount(""); setNote("");
    }, "Mouvement enregistré dans le journal déclaré. Vérifiez l'absence de double saisie.");
  };

  const setExistingOpening = (e: FormEvent) => {
    e.preventDefault();
    if (!existingAccountOpeningId || verifiedOpeningBalance === "" || !verifiedOpeningDate) return;
    void submit(async () => {
      await serviceIaFetch(`/finance/accounts/${encodeURIComponent(existingAccountOpeningId)}/opening`, {
        method: "PATCH",
        body: JSON.stringify({opening_balance: verifiedOpeningBalance, opening_date: verifiedOpeningDate}),
      });
      setVerifiedOpeningBalance(""); setVerifiedOpeningDate(""); setExistingAccountOpeningId("");
    }, "Solde d'ouverture déclaré. La correction d'un solde confirmé exige une procédure auditée.");
  };

  const saveClassification = (e: FormEvent) => {
    e.preventDefault();
    if (!expenseId) return;
    void submit(() => serviceIaFetch(`/finance/expenses/${encodeURIComponent(expenseId)}/classification`, {
      method: "PUT", body: JSON.stringify({ behavior, relation }),
    }), "Classification enregistrée, sans calculer artificiellement une marge.");
  };

  const transfer = (e: FormEvent) => {
    e.preventDefault();
    void submit(async () => {
      await serviceIaFetch("/finance/transfers", {
        method: "POST",
        body: JSON.stringify({
          source_account_id: sourceAccountId,
          target_account_id: targetAccountId,
          amount: transferAmount,
          occurred_on: movementDate,
        }),
      });
      setTransferAmount("");
    }, "Transfert équilibré : sortie et entrée enregistrées sans créer de richesse.");
  };

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div>
        <Link href="/espace/caisse" className="text-sm text-emerald-700 hover:underline dark:text-emerald-400">← Retour à la caisse</Link>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Comptes et mouvements de trésorerie</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Saisissez uniquement des montants vérifiés. Les soldes affichés proviennent des déclarations et ne constituent pas un rapprochement bancaire.</p>
      </div>
      {error && <p role="alert" className="rounded-xl border border-red-300 p-3 text-red-700 dark:text-red-300">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-300 p-3 text-emerald-700 dark:text-emerald-300">{notice}</p>}
      <section className="grid gap-4 sm:grid-cols-2">
        {accounts.map((a) => (
          <article key={a.account_id} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
            <h2 className="font-semibold">{a.name} — {a.currency}</h2>
            <p className="mt-3 text-xl font-bold tabular-nums">{a.balance === null ? "Non calculable" : `${a.balance} ${a.currency}`}</p>
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">Déclaré, non rapproché avec la banque</p>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Entrées enregistrées : {a.recorded_inflows} · Sorties : {a.recorded_outflows}</p>
            {!a.opening_date && <p className="mt-2 text-xs">Solde initial et date d'ouverture absents.</p>}
          </article>
        ))}
        {accounts.length === 0 && <p className="rounded-xl border border-dashed p-4 text-sm">Aucun compte enregistré. Aucun solde n'est inventé.</p>}
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={createAccount} className="space-y-3 rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
          <h2 className="text-lg font-semibold">Ajouter un compte</h2>
          <label className="block text-sm font-medium">Nom du compte<input required maxLength={120} className={`${field} mt-1`} value={name} onChange={(e) => setName(e.target.value)} placeholder="Caisse principale" /></label>
          <label className="block text-sm font-medium">Devise<select className={`${field} mt-1`} value={currency} onChange={(e) => setCurrency(e.target.value)}><option value="XOF">XOF</option><option value="EUR">EUR</option><option value="USD">USD</option></select></label>
          <label className="block text-sm font-medium">Solde d'ouverture vérifié (facultatif)<input type="number" step="0.01" className={`${field} mt-1`} value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} placeholder="Laisser vide si inconnu" /></label>
          <label className="block text-sm font-medium">Date du solde d'ouverture<input type="date" className={`${field} mt-1`} value={openingDate} onChange={(e) => setOpeningDate(e.target.value)} /></label>
          <p className="text-xs text-slate-500">Un solde et sa date doivent être fournis ensemble ; zéro n'est accepté que s'il est réellement vérifié.</p>
          <button disabled={busy} type="submit" className={button}>Enregistrer le compte</button>
        </form>
        <form onSubmit={createMovement} className="space-y-3 rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
          <h2 className="text-lg font-semibold">Enregistrer un mouvement réel</h2>
          <label className="block text-sm font-medium">Compte<select required className={`${field} mt-1`} value={accountId} onChange={(e) => setAccountId(e.target.value)}><option value="">Choisir</option>{accounts.map((a) => <option key={a.account_id} value={a.account_id}>{a.name} — {a.currency}</option>)}</select></label>
          <label className="block text-sm font-medium">Date<input required type="date" className={`${field} mt-1`} value={movementDate} onChange={(e) => setMovementDate(e.target.value)} /></label>
          <label className="block text-sm font-medium">Montant<input required min="0.01" step="0.01" type="number" className={`${field} mt-1`} value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
          <label className="block text-sm font-medium">Sens<select className={`${field} mt-1`} value={direction} onChange={(e) => setDirection(e.target.value as "in" | "out")}><option value="in">Entrée</option><option value="out">Sortie</option></select></label>
          <label className="block text-sm font-medium">Nature<select className={`${field} mt-1`} value={category} onChange={(e) => setCategory(e.target.value)}><option value="other">Autre mouvement</option><option value="capital">Apport</option><option value="withdrawal">Retrait</option><option value="loan">Emprunt</option><option value="loan_repayment">Remboursement emprunt</option></select></label>
          <label className="block text-sm font-medium">Note (facultative)<input className={`${field} mt-1`} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} /></label>
          <p className="text-xs text-amber-700 dark:text-amber-400">Ne ressaisissez pas un paiement commercial déjà inscrit dans ce journal. Les transferts se font par une opération distincte à deux comptes.</p>
          <button disabled={busy || !accountId} type="submit" className={button}>Enregistrer le mouvement</button>
        </form>
      </div>
      {accounts.some((a) => !a.opening_date) && (
        <form onSubmit={setExistingOpening} className="space-y-3 rounded-2xl border border-amber-200 p-5 dark:border-amber-900">
          <h2 className="text-lg font-semibold">Compléter un solde d'ouverture manquant</h2>
          <p className="text-sm text-slate-500">Saisissez uniquement un solde d'ouverture réellement constaté. Une fois confirmé, il n'est pas modifiable sans une opération de correction auditée.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-sm font-medium">Compte<select required className={`${field} mt-1`} value={existingAccountOpeningId} onChange={(e) => setExistingAccountOpeningId(e.target.value)}><option value="">Choisir</option>{accounts.filter(a => !a.opening_date).map(a => <option value={a.account_id} key={a.account_id}>{a.name}</option>)}</select></label>
            <label className="block text-sm font-medium">Solde constaté<input required type="number" step="0.01" className={`${field} mt-1`} value={verifiedOpeningBalance} onChange={(e) => setVerifiedOpeningBalance(e.target.value)} /></label>
            <label className="block text-sm font-medium">Date du constat<input required type="date" className={`${field} mt-1`} value={verifiedOpeningDate} onChange={(e) => setVerifiedOpeningDate(e.target.value)} /></label>
          </div>
          <button type="submit" disabled={busy || !existingAccountOpeningId} className={button}>Confirmer le solde</button>
        </form>
      )}
      <div className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={transfer} className="space-y-3 rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
          <h2 className="text-lg font-semibold">Transfert entre comptes</h2>
          <p className="text-xs text-slate-500">Un transfert n'est ni une recette ni une dépense. Deux écritures équilibrées sont créées.</p>
          <label className="block text-sm font-medium">Compte de départ<select required className={`${field} mt-1`} value={sourceAccountId} onChange={(e) => setSourceAccountId(e.target.value)}><option value="">Choisir</option>{accounts.map(a => <option key={a.account_id} value={a.account_id}>{a.name} — {a.currency}</option>)}</select></label>
          <label className="block text-sm font-medium">Compte d'arrivée<select required className={`${field} mt-1`} value={targetAccountId} onChange={(e) => setTargetAccountId(e.target.value)}><option value="">Choisir</option>{accounts.map(a => <option key={a.account_id} value={a.account_id}>{a.name} — {a.currency}</option>)}</select></label>
          <label className="block text-sm font-medium">Montant du transfert<input required type="number" step="0.01" min="0.01" className={`${field} mt-1`} value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} /></label>
          <button type="submit" className={button} disabled={busy || accounts.length < 2 || sourceAccountId === targetAccountId}>Enregistrer le transfert</button>
        </form>
        <form onSubmit={saveClassification} className="space-y-3 rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
          <h2 className="text-lg font-semibold">Qualifier une dépense</h2>
          <p className="text-xs text-slate-500">Ne classez une charge comme fixe, variable ou directe que si sa nature est connue.</p>
          <label className="block text-sm font-medium">Dépense<select required className={`${field} mt-1`} value={expenseId} onChange={(e) => setExpenseId(e.target.value)}><option value="">Sélectionner</option>{expenses.map(e => <option key={e.id} value={e.id}>{e.reference} — {e.amount} {e.currency || ""}</option>)}</select></label>
          <label className="block text-sm font-medium">Comportement<select className={`${field} mt-1`} value={behavior} onChange={(e) => setBehavior(e.target.value as typeof behavior)}><option value="unknown">Non déterminé</option><option value="fixed">Fixe</option><option value="variable">Variable</option></select></label>
          <label className="block text-sm font-medium">Relation à l'activité<select className={`${field} mt-1`} value={relation} onChange={(e) => setRelation(e.target.value as typeof relation)}><option value="unknown">Non déterminée</option><option value="direct">Coût direct</option><option value="indirect">Coût indirect</option></select></label>
          <button type="submit" className={button} disabled={busy || !expenseId}>Enregistrer la classification</button>
        </form>
      </div>
      <section className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
        <h2 className="font-semibold">Couverture des classifications de dépenses</h2>
        <p className="mt-2 text-sm">{coverage ? `${coverage.classified_count} dépense(s) classée(s) sur ${coverage.expense_count}; ${coverage.unclassified_count} restant à qualifier.` : "Chargement..."}</p>
        <p className="mt-1 text-sm text-slate-500">Marge et seuil de rentabilité : non calculables tant que les coûts et le chiffre d'affaires correspondants ne sont pas fiabilisés.</p>
        <Link href="/espace/depenses" className="mt-3 inline-block text-sm font-medium text-emerald-700 hover:underline">Consulter les dépenses →</Link>
      </section>
    </main>
  );
}
