"use client";

import { useState } from "react";
import {
  CreditCard,
  CheckCircle2,
  DollarSign,
  Calendar,
  Sparkles,
  Zap,
} from "lucide-react";
import { Dialog, FormError } from "./Dialog";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { formatMoney } from "./RegistersTable";
import { SaleItem } from "./RegistersTable";

interface RecordPaymentModalProps {
  open: boolean;
  onClose: () => void;
  sale: SaleItem | null;
  onPaymentRecorded: () => Promise<void> | void;
}

export function RecordPaymentModal({
  open,
  onClose,
  sale,
  onPaymentRecorded,
}: RecordPaymentModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("Espèces");
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [comment, setComment] = useState<string>("");

  if (!open || !sale) return null;

  const total = Number(sale.total_amount) || 0;
  const alreadyPaid = Number(sale.paid_amount || 0);
  const balanceDue = Math.max(0, total - alreadyPaid);
  const currency = sale.currency || "XOF";

  const handleApplyPreset = (percent: number) => {
    let presetValue = 0;
    if (percent === 100) {
      presetValue = balanceDue;
    } else {
      presetValue = Math.round((total * percent) / 100);
      presetValue = Math.min(presetValue, balanceDue);
    }
    setAmount(String(presetValue));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Veuillez saisir un montant supérieur à 0");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await serviceIaFetch(`/registers/sales/${sale.id}/record-payment`, {
        method: "POST",
        body: JSON.stringify({
          amount: numAmount,
          payment_method: paymentMethod,
          payment_date: paymentDate,
          comment: comment.trim() || `Acompte / Règlement de ${formatMoney(numAmount, currency)}`,
        }),
      });

      await onPaymentRecorded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement de l'acompte");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title="Encaisser un Acompte ou Solde"
      description={`Enregistrez un versement pour la vente ${sale.reference} (${sale.client_name || "Client"}).`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Settlement Summary Header */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border text-center text-xs">
          <div>
            <span className="text-[10px] text-muted-foreground block font-bold">Total Vente</span>
            <strong className="text-foreground font-black">{formatMoney(total, currency)}</strong>
          </div>
          <div>
            <span className="text-[10px] text-emerald-600 block font-bold">Déjà Encaissé</span>
            <strong className="text-emerald-600 font-black">{formatMoney(alreadyPaid, currency)}</strong>
          </div>
          <div>
            <span className="text-[10px] text-amber-600 block font-bold">Solde Restant</span>
            <strong className="text-amber-600 font-black">{formatMoney(balanceDue, currency)}</strong>
          </div>
        </div>

        {/* Quick Percent Presets (25%, 30%, 50%, Solde 100%) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground block">
            Raccourcis d&apos;acompte rapides :
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "25 %", pct: 25 },
              { label: "30 %", pct: 30 },
              { label: "50 %", pct: 50 },
              { label: "Solde 100%", pct: 100 },
            ].map((p) => {
              const val = p.pct === 100 ? balanceDue : Math.round((total * p.pct) / 100);
              return (
                <button
                  key={p.pct}
                  type="button"
                  onClick={() => handleApplyPreset(p.pct)}
                  className="px-2.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-black transition cursor-pointer flex flex-col items-center"
                >
                  <span>{p.label}</span>
                  <small className="text-[9.5px] font-bold text-emerald-600/80">
                    {formatMoney(val, currency)}
                  </small>
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount Input */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-foreground block">
            Montant à encaisser maintenant * ({currency})
          </label>
          <input
            type="number"
            min="1"
            max={balanceDue}
            step="any"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Ex: ${balanceDue}`}
            className="w-full p-2.5 rounded-xl border border-input bg-background text-sm font-black text-foreground outline-none focus:border-primary"
          />
        </div>

        {/* Payment Method & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground block">Mode de règlement *</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-input bg-background text-xs font-bold text-foreground outline-none focus:border-primary"
            >
              <option value="Espèces">💵 Espèces (Cash)</option>
              <option value="Wave">🌊 Wave</option>
              <option value="Orange Money">🍊 Orange Money</option>
              <option value="MTN MoMo">🟡 MTN Mobile Money</option>
              <option value="Moov Money">🔵 Moov Money</option>
              <option value="Carte Bancaire">💳 Carte Bancaire</option>
              <option value="Virement bancaire">🏦 Virement Bancaire</option>
              <option value="Chèque">📑 Chèque</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground block">Date d&apos;encaissement</label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-input bg-background text-xs font-bold text-foreground outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Notes / Comment */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-foreground block">Note ou référence de reçu</label>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ex: Acompte n°1 reçu par Wave / Réf: TX-8493"
            className="w-full p-2.5 rounded-xl border border-input bg-background text-xs text-foreground outline-none focus:border-primary"
          />
        </div>

        <FormError>{error}</FormError>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={onClose}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving || !amount}
            className="app-button app-button-primary"
          >
            {saving ? "Validation..." : "Valider l'encaissement"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
