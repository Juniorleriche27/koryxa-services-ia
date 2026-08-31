"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  CheckCircle2,
  Sparkles,
  Zap,
  ShieldCheck,
  Smartphone,
  ArrowRight,
  Clock,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Lock,
  ChevronRight,
} from "lucide-react";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { StatusPill } from "./Ui";

interface PlanOffer {
  code: string;
  name: string;
  plan: string;
  period_months: number;
  amount_minor: number;
  currency: string;
  display_price: string;
  is_launch_deal: boolean;
  original_price?: string;
  features: string[];
  max_senders: number;
}

interface BillingStatusData {
  subscription_plan: string;
  subscription_status: string;
  subscription_period_months: number;
  subscription_ends_at: string | null;
  days_remaining: number | null;
  max_authorized_senders: number;
  active_senders_count: number;
  is_trial: boolean;
  is_active: boolean;
  available_plans: PlanOffer[];
}

export function BillingPlansView() {
  const [data, setData] = useState<BillingStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlanCode, setSelectedPlanCode] = useState<string>("pack_business_3m");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [provider, setProvider] = useState<string>("leekpay");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await serviceIaFetch<BillingStatusData>("/billing/status");
      setData(res);
    } catch (e: any) {
      setError("Impossible de charger les informations d'abonnement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleCheckout = async (planCode: string) => {
    try {
      setProcessing(true);
      setError(null);
      const res = await serviceIaFetch<{
        checkout_url: string;
        payment_id?: string;
        idempotency_key: string;
      }>("/billing/checkout", {
        method: "POST",
        body: JSON.stringify({
          product_code: planCode,
          provider: provider,
          customer_phone: phoneNumber.trim() || undefined,
        }),
      });

      if (res && res.checkout_url) {
        window.location.href = res.checkout_url;
      }
    } catch (e: any) {
      setError(e.message || "Erreur lors de l'initialisation du paiement KORYXA Payment.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const selectedPlan = data?.available_plans.find((p) => p.code === selectedPlanCode) || data?.available_plans[0];

  return (
    <div className="space-y-8">
      {/* Current Subscription Status Header Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-slate-950">Statut de votre Formule</h2>
              {data?.is_trial ? (
                <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-bold text-amber-800">
                  🎁 Période d'Essai (14j)
                </span>
              ) : data?.is_active ? (
                <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800">
                  🟢 Formule Active ({data?.subscription_plan.toUpperCase()})
                </span>
              ) : (
                <span className="rounded-full bg-red-100 px-3 py-0.5 text-xs font-bold text-red-800">
                  🔴 Expiré / Suspendu
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {data?.days_remaining !== null && data?.days_remaining !== undefined ? (
                data.days_remaining > 0 ? (
                  <span>Il vous reste <strong>{data.days_remaining} jours</strong> d'utilisation sur cette période.</span>
                ) : (
                  <span className="text-red-600 font-semibold">Votre période d'essai est arrivée à échéance. Souscrivez ci-dessous pour continuer.</span>
                )
              ) : (
                <span>Aucune date limite définie.</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 border border-slate-200/80">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <Smartphone size={20} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                {data?.active_senders_count} / {data?.max_authorized_senders} Numéros WhatsApp
              </div>
              <div className="text-[11px] text-slate-500">
                {data?.max_authorized_senders === 1 ? "Formule Solo (Gérant)" : "Formule Multi-Vendeurs"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Special Launch Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-emerald-800 via-teal-900 to-slate-900 p-6 text-white shadow-lg">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-300 backdrop-blur-xs">
              <Sparkles size={14} />
              Offre Spéciale de Lancement · 3 Mois (-33 %)
            </div>
            <h3 className="text-xl font-extrabold tracking-tight sm:text-2xl">
              Payez 3 mois d'un coup et gagnez toute la saison sereinement
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Encaissable instantanément par <strong>Wave, Orange Money, MTN MoMo et Moov</strong> via notre passerelle officielle KORYXA Payment.
            </p>
          </div>

          <div className="shrink-0">
            <button
              onClick={() => handleCheckout("pack_business_3m")}
              disabled={processing}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3.5 text-sm font-extrabold text-slate-950 shadow-md transition hover:bg-emerald-300 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Zap size={18} className="fill-current" />
              <span>{processing ? "Redirection…" : "Prendre le Pack 3 Mois"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Plans Selection Grid */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-950">Choisissez votre Formule</h3>
          <p className="text-xs text-slate-500">Toutes nos formules incluent la dictée vocale WhatsApp illimitée et les sauvegardes chiffrées.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 p-4 border border-red-200 text-xs font-bold text-red-700 flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {data?.available_plans.map((p) => {
            const isSelected = selectedPlanCode === p.code;
            const isBusiness = p.plan === "business";

            return (
              <div
                key={p.code}
                className={`relative flex flex-col justify-between rounded-3xl border-2 p-6 transition-all ${
                  isSelected
                    ? "border-emerald-600 bg-white shadow-xl ring-2 ring-emerald-500/20"
                    : "border-slate-200 bg-white/70 hover:border-emerald-300 hover:bg-white"
                }`}
              >
                {p.is_launch_deal && (
                  <div className="absolute -top-3 right-6 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-sm">
                    Pack 3 Mois Éco
                  </div>
                )}

                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-lg font-extrabold text-slate-950">{p.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {p.max_senders === 1 ? "Idéal pour commerçant indépendant" : "Pour magasin avec 2 à 3 vendeurs"}
                      </p>
                    </div>
                    {isBusiness && (
                      <span className="rounded-xl bg-amber-100 p-1.5 text-amber-700">
                        <Sparkles size={18} />
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-950">{p.display_price}</span>
                    {p.original_price && (
                      <span className="text-sm font-semibold text-slate-400 line-through">
                        {p.original_price}
                      </span>
                    )}
                  </div>

                  <div className="my-6 h-px bg-slate-100" />

                  <ul className="space-y-3 text-xs text-slate-700">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <CheckCircle2 size={16} className="shrink-0 text-emerald-600 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleCheckout(p.code)}
                    disabled={processing}
                    className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold transition cursor-pointer ${
                      isBusiness
                        ? "bg-emerald-600 text-white shadow-md hover:bg-emerald-700"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    <span>{processing ? "Connexion KORYXA Payment…" : `Souscrire à ${p.display_price}`}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security & Mobile Money Guarantee */}
      <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5 text-center text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-slate-800 font-semibold">
          <ShieldCheck size={18} className="text-emerald-600" />
          <span>Paiement sécurisé par KORYXA Payment (Wave, Orange, MTN, Moov)</span>
        </div>
        <div className="flex items-center gap-4 text-slate-500 text-[11px]">
          <span>✓ Activation instantanée</span>
          <span>✓ Reçu WhatsApp automatique</span>
          <span>✓ Zéro frais caché</span>
        </div>
      </div>
    </div>
  );
}
