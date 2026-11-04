"use client";

import React, { useState } from "react";
import {
  CreditCard,
  Smartphone,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Loader2,
  X,
} from "lucide-react";
import { soundFx } from "./soundEffects";

export type PaymentMethodType = "wave" | "orange_money" | "mtn_momo" | "moov_money" | "card";

interface PaymentDrawerProps {
  open: boolean;
  onClose: () => void;
  currency: string;
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  clientPhone?: string | null;
  clientName?: string | null;
  onPaymentSuccess: (res: { transactionId: string; amount: number; method: string }) => void;
  token: string;
}

interface ProviderOption {
  id: PaymentMethodType;
  label: string;
  badge: string;
  colorClass: string;
  badgeColor: string;
  description: string;
  icon: typeof Smartphone;
}

const PROVIDERS: ProviderOption[] = [
  {
    id: "wave",
    label: "Wave",
    badge: "INSTANTANÉ",
    colorClass: "border-sky-500 bg-sky-50/40 hover:bg-sky-50 dark:bg-sky-950/20",
    badgeColor: "bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200",
    description: "Validation instantanée sans frais",
    icon: Smartphone,
  },
  {
    id: "orange_money",
    label: "Orange Money",
    badge: "SÉCURISÉ",
    colorClass: "border-orange-500 bg-orange-50/40 hover:bg-orange-50 dark:bg-orange-950/20",
    badgeColor: "bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200",
    description: "Code d'autorisation envoyé sur mobile",
    icon: Smartphone,
  },
  {
    id: "mtn_momo",
    label: "MTN Mobile Money",
    badge: "MOMO",
    colorClass: "border-yellow-500 bg-yellow-50/40 hover:bg-yellow-50 dark:bg-yellow-950/20",
    badgeColor: "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/60 dark:text-yellow-200",
    description: "Notification directe sur smartphone",
    icon: Smartphone,
  },
  {
    id: "moov_money",
    label: "Moov Money",
    badge: "MOOV",
    colorClass: "border-blue-600 bg-blue-50/40 hover:bg-blue-50 dark:bg-blue-950/20",
    badgeColor: "bg-blue-100 text-blue-900 dark:bg-blue-900/60 dark:text-blue-200",
    description: "Paiement direct USSD / Push",
    icon: Smartphone,
  },
  {
    id: "card",
    label: "Carte Bancaire",
    badge: "VISA / MC",
    colorClass: "border-indigo-500 bg-indigo-50/40 hover:bg-indigo-50 dark:bg-indigo-950/20",
    badgeColor: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200",
    description: "Cartes Visa, Mastercard & internationales",
    icon: CreditCard,
  },
];

export function PaymentDrawer({
  open,
  onClose,
  currency,
  totalAmount,
  paidAmount,
  remainingBalance,
  clientPhone,
  clientName,
  onPaymentSuccess,
  token,
}: PaymentDrawerProps) {
  const [selectedProvider, setSelectedProvider] = useState<PaymentMethodType>("wave");
  const [phone, setPhone] = useState(clientPhone || "");
  const [payerName, setPayerName] = useState(clientName || "");
  const [amountMode, setAmountMode] = useState<"full" | "deposit_30" | "deposit_50">("full");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const deposit30 = Math.round(remainingBalance * 0.3);
  const deposit50 = Math.round(remainingBalance * 0.5);

  const selectedAmount =
    amountMode === "deposit_30"
      ? deposit30
      : amountMode === "deposit_50"
      ? deposit50
      : remainingBalance;

  const handlePay = async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/public/documents/${token}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: selectedAmount,
          payment_method: selectedProvider,
          client_phone: phone || undefined,
          payer_name: payerName || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error?.message || data?.detail || "Échec du règlement en ligne.");
      }

      // Play executive cash-register chime
      soundFx.playCashRegisterSound();

      onPaymentSuccess({
        transactionId: data.transaction_id,
        amount: selectedAmount,
        method: selectedProvider,
      });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur de connexion.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white grid place-items-center shadow-xs">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-950 dark:text-white">
                Règlement Sécurisé 1-Clic
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mobile Money & Carte Bancaire sans déplacement
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full grid place-items-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Amount Selector Tabs */}
        <div className="space-y-2">
          <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Montant à régler
          </span>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setAmountMode("full")}
              className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                amountMode === "full"
                  ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-emerald-500"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              <span className="text-[10px] font-bold text-slate-500">Solde Intégral</span>
              <strong className="text-xs font-black text-slate-950 dark:text-white mt-1">
                {remainingBalance.toLocaleString("fr-FR")} {currency}
              </strong>
            </button>

            {remainingBalance > 5000 && (
              <>
                <button
                  type="button"
                  onClick={() => setAmountMode("deposit_50")}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    amountMode === "deposit_50"
                      ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-emerald-500"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <span className="text-[10px] font-bold text-slate-500">Acompte 50%</span>
                  <strong className="text-xs font-black text-slate-950 dark:text-white mt-1">
                    {deposit50.toLocaleString("fr-FR")} {currency}
                  </strong>
                </button>

                <button
                  type="button"
                  onClick={() => setAmountMode("deposit_30")}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    amountMode === "deposit_30"
                      ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-emerald-500"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <span className="text-[10px] font-bold text-slate-500">Acompte 30%</span>
                  <strong className="text-xs font-black text-slate-950 dark:text-white mt-1">
                    {deposit30.toLocaleString("fr-FR")} {currency}
                  </strong>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Payment Providers List */}
        <div className="space-y-2">
          <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Opérateur de paiement
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PROVIDERS.map((p) => {
              const Icon = p.icon;
              const isSelected = selectedProvider === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedProvider(p.id)}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? `${p.colorClass} ring-2 ring-emerald-600`
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 grid place-items-center shrink-0">
                      <Icon size={16} className="text-slate-700 dark:text-slate-200" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-xs font-black text-slate-950 dark:text-white">
                          {p.label}
                        </strong>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {p.description}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${p.badgeColor}`}
                  >
                    {p.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Payer Phone & Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Numéro de compte Mobile Money
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+225 07 00 00 00 00"
              className="w-full px-3 py-2.5 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nom complet du payeur
            </label>
            <input
              type="text"
              value={payerName}
              onChange={(e) => setPayerName(e.target.value)}
              placeholder="Ex: Awa Diop"
              className="w-full px-3 py-2.5 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 font-medium">
            {error}
          </div>
        )}

        {/* Security Trust Note */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-500">
          <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
          <span>
            Règlement direct chiffré TLS 256-bit certifié par la Mémoire Opérationnelle CAURI.
          </span>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handlePay}
            disabled={loading}
            className="w-full py-3.5 px-4 min-h-[48px] rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-black text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Paiement en cours d&apos;autorisation...</span>
              </>
            ) : (
              <>
                <span>
                  Régler {selectedAmount.toLocaleString("fr-FR")} {currency} en 1-Clic
                </span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
