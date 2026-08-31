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
  RefreshCw,
  Lock,
  Star,
  Layers,
  Receipt,
  Headphones,
  Check,
  Building,
} from "lucide-react";
import { serviceIaFetch } from "@/lib/service-ia/api";

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

const DEFAULT_PLANS: PlanOffer[] = [
  {
    code: "pack_starter_3m",
    name: "Starter Solo",
    plan: "starter",
    period_months: 3,
    amount_minor: 19900,
    currency: "XOF",
    display_price: "19 900 FCFA",
    is_launch_deal: true,
    original_price: "29 700 FCFA",
    max_senders: 1,
    features: [
      "1 Numéro WhatsApp connecté (Gérant)",
      "Dictée vocale & texte illimitée (Français & expressions locales)",
      "Reçus WhatsApp automatiques clients (PDF & texte)",
      "Bilan de caisse quotidien chaque soir à 21h sur WhatsApp",
      "Sauvegardes quotidiennes chiffrées AES-256",
    ],
  },
  {
    code: "pack_business_3m",
    name: "Business Multi-Vendeurs",
    plan: "business",
    period_months: 3,
    amount_minor: 39900,
    currency: "XOF",
    display_price: "39 900 FCFA",
    is_launch_deal: true,
    original_price: "59 700 FCFA",
    max_senders: 3,
    features: [
      "Jusqu'à 3 Numéros WhatsApp (Gérant + 2 Vendeurs)",
      "Tout ce qui est inclus dans Starter",
      "Gestion des stocks en direct & alertes de rupture WhatsApp",
      "Suivi des créances & relances clients en 1-clic",
      "Export comptable complet Excel / PDF certifié",
      "Support prioritaire direct sur WhatsApp 7j/7",
    ],
  },
  {
    code: "pack_starter_1m",
    name: "Starter Mensuel",
    plan: "starter",
    period_months: 1,
    amount_minor: 9900,
    currency: "XOF",
    display_price: "9 900 FCFA / mois",
    is_launch_deal: false,
    max_senders: 1,
    features: [
      "1 Numéro WhatsApp connecté",
      "Dictée vocale & caisse illimitée",
      "Reçus WhatsApp & bilans de fin de journée",
    ],
  },
  {
    code: "pack_business_1m",
    name: "Business Mensuel",
    plan: "business",
    period_months: 1,
    amount_minor: 19900,
    currency: "XOF",
    display_price: "19 900 FCFA / mois",
    is_launch_deal: false,
    max_senders: 3,
    features: [
      "Jusqu'à 3 Numéros WhatsApp",
      "Stocks, créances & alertes",
      "Export comptable & Support prioritaire",
    ],
  },
];

export function BillingPlansView() {
  const [billingData, setBillingData] = useState<BillingStatusData | null>(null);
  const [billingCycle, setBillingCycle] = useState<"3months" | "monthly">("3months");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [processingCode, setProcessingCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    serviceIaFetch<BillingStatusData>("/billing/status")
      .then((res) => {
        if (res && res.subscription_plan) setBillingData(res);
      })
      .catch(() => {
        // Fallback gracieux sans bloquer l'UI
      });
  }, []);

  const handleCheckout = async (planCode: string) => {
    try {
      setProcessingCode(planCode);
      setError(null);
      const res = await serviceIaFetch<{
        checkout_url: string;
        payment_id?: string;
        idempotency_key: string;
      }>("/billing/checkout", {
        method: "POST",
        body: JSON.stringify({
          product_code: planCode,
          provider: "leekpay",
          customer_phone: phoneNumber.trim() || undefined,
        }),
      });

      if (res && res.checkout_url) {
        window.location.href = res.checkout_url;
      }
    } catch (e: any) {
      setError(e.message || "Impossible d'initialiser le paiement pour le moment. Veuillez réessayer.");
    } finally {
      setProcessingCode(null);
    }
  };

  const isTrial = billingData?.is_trial ?? true;
  const isBusinessActive = billingData?.subscription_plan === "business";
  const daysLeft = billingData?.days_remaining ?? 14;

  const starterPlan = billingCycle === "3months" ? DEFAULT_PLANS[0] : DEFAULT_PLANS[2];
  const businessPlan = billingCycle === "3months" ? DEFAULT_PLANS[1] : DEFAULT_PLANS[3];

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-16">
      {/* 1. LUXURY STATUS BANNER */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-linear-to-br from-slate-950 via-slate-900 to-emerald-950 p-7 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-emerald-400">
                Abonnement KORYXA Service IA
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              {isTrial ? "Période d'Essai Active · 14 Jours" : `Formule ${billingData?.subscription_plan.toUpperCase()}`}
            </h2>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              {isTrial
                ? `Il vous reste environ ${daysLeft} jours d'essai complet sans engagement. Choisissez une formule ci-dessous pour continuer sans interruption.`
                : `Votre abonnement est actif. Tous vos services et la flotte WhatsApp sont opérationnels.`}
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 backdrop-blur-md border border-white/10 shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-400 to-teal-600 text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              <Smartphone size={22} />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-slate-400 uppercase">Capacité Flotte</div>
              <div className="text-sm font-black text-white">
                {billingData?.active_senders_count ?? 1} / {billingData?.max_authorized_senders ?? (isBusinessActive ? 3 : 1)} WhatsApp
              </div>
              <div className="text-[11px] text-emerald-400 font-semibold">
                {billingData?.max_authorized_senders === 1 ? "1 Gérant connecté" : "Multi-Vendeurs actif"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BILLING CYCLE TOGGLE (3 MOIS vs MENSUEL) */}
      <div className="flex flex-col items-center justify-center space-y-3">
        <div className="inline-flex items-center gap-1 rounded-2xl bg-slate-100 p-1.5 border border-slate-200 shadow-inner">
          <button
            type="button"
            onClick={() => setBillingCycle("3months")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              billingCycle === "3months"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-105"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles size={14} className="fill-current" />
            <span>Pack Lancement 3 Mois</span>
            <span className="rounded-full bg-amber-400 text-slate-950 px-2 py-0.5 text-[10px] font-black uppercase">
              -33 %
            </span>
          </button>

          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`rounded-xl px-5 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              billingCycle === "monthly"
                ? "bg-slate-900 text-white shadow-md scale-105"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Facturation Mensuelle
          </button>
        </div>
        <p className="text-[11px] text-slate-500 font-medium">
          {billingCycle === "3months"
            ? "⭐ Économisez 33% et assurez la gestion de votre commerce pour toute la saison"
            : "Renouvellement automatique chaque mois par Mobile Money"}
        </p>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 text-center shadow-xs">
          {error}
        </div>
      )}

      {/* 3. LUXURY PRICING CARDS */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* CARD 1: STARTER SOLO */}
        <div className="relative flex flex-col justify-between rounded-3xl border-2 border-slate-200 bg-white p-8 shadow-lg transition hover:border-slate-300 hover:shadow-xl">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-slate-700">
                  Formule Solo
                </span>
                <h3 className="text-2xl font-black text-slate-950 mt-2">{starterPlan.name}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Parfait pour commerçant indépendant, boutique 1 gérant et prestataires.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-950">{starterPlan.display_price}</span>
              {starterPlan.original_price && (
                <span className="text-sm font-bold text-slate-400 line-through">
                  {starterPlan.original_price}
                </span>
              )}
            </div>
            {billingCycle === "3months" && (
              <div className="text-[11px] font-bold text-emerald-700 mt-1">
                Soit l'équivalent de ~6 600 FCFA / mois
              </div>
            )}

            <div className="my-6 h-px bg-slate-100" />

            <div className="space-y-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Inclus dans votre offre :
              </span>
              <ul className="space-y-3 text-xs text-slate-700 font-medium">
                {starterPlan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-600 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => handleCheckout(starterPlan.code)}
              disabled={processingCode === starterPlan.code}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 text-xs font-black text-white shadow-md hover:bg-slate-800 transition active:scale-98 cursor-pointer"
            >
              <span>
                {processingCode === starterPlan.code
                  ? "Connexion KORYXA Payment…"
                  : `Souscrire à ${starterPlan.display_price}`}
              </span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

        {/* CARD 2: BUSINESS (BEST SELLER) */}
        <div className="relative flex flex-col justify-between rounded-3xl border-2 border-emerald-500 bg-gradient-to-b from-white via-emerald-50/20 to-white p-8 shadow-2xl ring-4 ring-emerald-500/10">
          <div className="absolute -top-3.5 right-8 rounded-full bg-linear-to-r from-emerald-600 to-teal-600 px-4 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-md flex items-center gap-1.5">
            <Star size={12} className="fill-current" />
            Recommandé · Best Seller
          </div>

          <div>
            <div className="flex items-center justify-between">
              <div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-800">
                  Formule PME & Équipe
                </span>
                <h3 className="text-2xl font-black text-slate-950 mt-2">{businessPlan.name}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Idéal pour quincailleries, magasins avec vendeurs, grossistes et dépôts.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-950">{businessPlan.display_price}</span>
              {businessPlan.original_price && (
                <span className="text-sm font-bold text-slate-400 line-through">
                  {businessPlan.original_price}
                </span>
              )}
            </div>
            {billingCycle === "3months" && (
              <div className="text-[11px] font-bold text-emerald-700 mt-1">
                Soit l'équivalent de ~13 300 FCFA / mois
              </div>
            )}

            <div className="my-6 h-px bg-emerald-100/80" />

            <div className="space-y-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900">
                Tout le pack Starter PLUS :
              </span>
              <ul className="space-y-3 text-xs text-slate-800 font-medium">
                {businessPlan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white mt-0.5">
                      <Check size={11} strokeWidth={3} />
                    </div>
                    <span className={i === 0 ? "font-bold text-emerald-950" : ""}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-emerald-100">
            <button
              type="button"
              onClick={() => handleCheckout(businessPlan.code)}
              disabled={processingCode === businessPlan.code}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-emerald-600 via-emerald-500 to-teal-600 py-4 text-xs font-black text-white shadow-xl shadow-emerald-600/30 hover:brightness-110 transition active:scale-98 cursor-pointer"
            >
              <Zap size={16} className="fill-current" />
              <span>
                {processingCode === businessPlan.code
                  ? "Connexion KORYXA Payment…"
                  : `Souscrire au Pack Business (${businessPlan.display_price})`}
              </span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. PAYMENT METHODS & ZERO TRUST SECURITY */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xs space-y-4 text-center">
        <div className="text-xs font-black uppercase tracking-widest text-slate-400">
          Moyens de Paiement Acceptés en 1 Clic
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl bg-sky-50 px-4 py-2 border border-sky-200/70 shadow-xs">
            <span className="h-3 w-3 rounded-full bg-sky-500" />
            <strong className="text-xs font-black text-sky-900">Wave CI & Sénégal</strong>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-orange-50 px-4 py-2 border border-orange-200/70 shadow-xs">
            <span className="h-3 w-3 rounded-full bg-orange-500" />
            <strong className="text-xs font-black text-orange-900">Orange Money</strong>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-yellow-50 px-4 py-2 border border-yellow-200/70 shadow-xs">
            <span className="h-3 w-3 rounded-full bg-yellow-500" />
            <strong className="text-xs font-black text-yellow-900">MTN MoMo</strong>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-blue-50 px-4 py-2 border border-blue-200/70 shadow-xs">
            <span className="h-3 w-3 rounded-full bg-blue-600" />
            <strong className="text-xs font-black text-blue-900">Moov Money</strong>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-2 border border-slate-200 shadow-xs">
            <CreditCard size={14} className="text-slate-700" />
            <strong className="text-xs font-black text-slate-800">Cartes Bancaires</strong>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center gap-6 text-[11px] text-slate-500 font-semibold">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600" /> Passerelle Officielle KORYXA Payment
          </span>
          <span>✓ Activation immédiate sans délai</span>
          <span>✓ Facture & Reçu certifié WhatsApp</span>
          <span>✓ Zéro engagement · Annulable à tout moment</span>
        </div>
      </div>
    </div>
  );
}
