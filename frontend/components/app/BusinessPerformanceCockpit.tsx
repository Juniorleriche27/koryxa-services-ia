"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Hourglass,
  Activity,
  ArrowUpRight,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Percent,
  Wallet,
  ReceiptText,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight,
} from "lucide-react";
import { formatMoney } from "./RegistersTable";

export interface BusinessPerformanceProps {
  totalSales: number;
  totalPaid: number;
  totalUnpaid: number;
  totalExpensesPaid: number;
  totalExpensesUnpaid: number;
  netCash: number;
  totalSalesCount: number;
  currency: string;
  // Pre-calculated or fallback props
  estimatedGrossMargin?: number | null;
  grossMarginRate?: number | null;
  averageOrderValue?: number | null;
  breakEvenPoint?: number | null;
  breakEvenProgress?: number | null;
  recoveryRate?: number | null;
  dailyBurnRate?: number | null;
  cashRunwayDays?: number | null;
  workingCapital?: number | null;
  financialDataStatus?: string;
  financialWarnings?: string[];
  financialIndicatorReasons?: Record<string, string>;
}

export function BusinessPerformanceCockpit({
  totalSales,
  totalPaid,
  totalUnpaid,
  totalExpensesPaid,
  totalExpensesUnpaid,
  netCash,
  totalSalesCount,
  currency,
  estimatedGrossMargin: propGrossMargin,
  grossMarginRate: propMarginRate,
  averageOrderValue: propAov,
  breakEvenPoint: propBreakEven,
  breakEvenProgress: propBreakEvenProgress,
  recoveryRate: propRecoveryRate,
  dailyBurnRate: propDailyBurn,
  cashRunwayDays: propRunwayDays,
  workingCapital: propWorkingCapital,
  financialDataStatus,
  financialWarnings = [],
  financialIndicatorReasons = {},
}: BusinessPerformanceProps) {
  const [activeTab, setActiveTab] = useState<"all" | "profitability" | "cashflow">("all");

  // Explicitly unknown indicators must never be rebuilt from incompatible registers.
  const grossMargin = propGrossMargin ?? null;
  const missing = (key: string, fallback: string) => financialIndicatorReasons[key] || fallback;
  const marginRate = propMarginRate ?? null;
  const aov = propAov ?? (totalSalesCount ? totalSales / totalSalesCount : null);
  const breakEvenPoint = propBreakEven ?? null;
  const breakEvenProgress = propBreakEvenProgress ?? null;
  const breakEvenRemaining = breakEvenPoint === null ? null : Math.max(0, breakEvenPoint - totalSales);
  const recoveryRate = propRecoveryRate ?? null;
  const dailyBurn = propDailyBurn ?? null;
  const runwayDays = propRunwayDays ?? null;
  const workingCapital = propWorkingCapital ?? null;

  let diagnosticTitle = "Rentabilité non calculable";
  let diagnosticText = "Coûts directs et soldes d’ouverture à compléter pour calculer la rentabilité.";
  let diagnosticStatus: "success" | "warning" | "alert" = "warning";
  if (totalPaid < 0 || totalExpensesPaid < 0) diagnosticStatus = "alert";
  if (financialDataStatus === "registers_only" && totalSales > 0 && recoveryRate !== null && recoveryRate < 60 && totalUnpaid > 0) {
    diagnosticTitle = "Encaissements à surveiller";
    diagnosticText = `${recoveryRate === null ? "Non calculable" : `${recoveryRate}%`} des ventes suivies sont encaissées. Vérifiez les échéances avant de qualifier les créances d'impayées.`;
  }

  if (financialDataStatus !== "registers_only") {
    diagnosticTitle = "Données financières non comparables";
    diagnosticText = financialWarnings.join(" ") || "Vérifiez les devises et la concordance des paiements.";
  }

  return (
    <section className="mb-8">
      {/* Section Header with Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Indicateurs
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
              Analyse financière
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white tracking-tight mt-0.5">
            Performance financière
          </h2>
        </div>

        {/* Tab switchers */}
        <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 self-start sm:self-auto shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
              activeTab === "all"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Vue Globale
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("profitability")}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
              activeTab === "profitability"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Rentabilité &amp; Marges
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("cashflow")}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
              activeTab === "cashflow"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Trésorerie &amp; Risques
          </button>
        </div>
      </div>

      {/* Strategic AI Executive Diagnostic Card */}
      <div
        className={`mb-5 p-4 sm:p-5 rounded-2xl border transition-all ${
          diagnosticStatus === "alert"
            ? "bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60"
            : diagnosticStatus === "warning"
            ? "bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60"
            : "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60"
        }`}
      >
        <div className="flex items-start gap-3 sm:gap-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
              diagnosticStatus === "alert"
                ? "bg-rose-500 text-white"
                : diagnosticStatus === "warning"
                ? "bg-amber-500 text-white"
                : "bg-emerald-600 text-white"
            }`}
          >
            {diagnosticStatus === "alert" ? (
              <ShieldAlert size={20} />
            ) : diagnosticStatus === "warning" ? (
              <AlertTriangle size={20} />
            ) : (
              <ShieldCheck size={20} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className={`text-[11px] font-semibold uppercase tracking-wider ${
                  diagnosticStatus === "alert"
                    ? "text-rose-700 dark:text-rose-400"
                    : diagnosticStatus === "warning"
                    ? "text-amber-700 dark:text-amber-400"
                    : "text-emerald-700 dark:text-emerald-400"
                }`}
              >
                État financier
              </span>
              <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                · {diagnosticTitle}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {diagnosticText}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent("koryxa:open-cora", {
                  detail: { prompt: "Analyse en détail mes indicateurs de rentabilité et de trésorerie du jour." },
                })
              );
            }}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-bold shrink-0 shadow-2xs hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
          >
            <span>Voir les détails</span>
          </button>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* ── CARD 1: Marge Brute / Résultat Opérationnel ── */}
        {(activeTab === "all" || activeTab === "profitability") && (
          <article className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-emerald-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Marge Brute Opérationnelle
                </span>
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    grossMargin === null || grossMargin >= 0
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {grossMargin === null || grossMargin >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-1">
                <strong
                  className={`text-xl sm:text-2xl font-semibold tracking-tight ${
                    grossMargin === null || grossMargin >= 0
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {grossMargin === null ? "À compléter" : formatMoney(grossMargin, currency)}
                </strong>
              </div>

              {grossMargin === null && <p className="text-[11px] leading-relaxed text-slate-500 mt-2">{missing("estimated_gross_margin", "Coûts des ventes à préciser.")}</p>}
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black ${
                    (marginRate ?? 0) >= 30
                      ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300"
                      : (marginRate ?? 0) >= 10
                      ? "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300"
                      : "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300"
                  }`}
                >
                  <Percent size={11} />
                  {marginRate === null ? "Non calculable" : `${marginRate}% de marge`}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  sur ventes
                </span>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Chiffre d&apos;Affaires :</span>
              <strong className="text-slate-800 dark:text-slate-200">
                {formatMoney(totalSales, currency)}
              </strong>
            </div>
          </article>
        )}

        {/* ── CARD 2: Seuil de Rentabilité (Point Mort) ── */}
        {(activeTab === "all" || activeTab === "profitability") && (
          <article className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-emerald-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Seuil de Rentabilité (Point Mort)
                </span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Scale size={16} />
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-2">
                <strong className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
                  {breakEvenPoint === null ? "À compléter" : formatMoney(breakEvenPoint, currency)}
                </strong>
              </div>

              {breakEvenPoint === null && <p className="text-[11px] leading-relaxed text-slate-500 mb-2">{missing("break_even_point", "Charges fixes et coûts variables nécessaires.")}</p>}
              {/* Progress meter */}
              <div className="space-y-1.5 mb-2">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-600 dark:text-slate-400">Charges couvertes</span>
                  <span
                    className={
                      (breakEvenProgress ?? 0) >= 100
                        ? "text-emerald-600 dark:text-emerald-400 font-black"
                        : "text-amber-600 dark:text-amber-400 font-black"
                    }
                  >
                    {breakEvenProgress === null ? "Non calculable" : `${breakEvenProgress}%`}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      (breakEvenProgress ?? 0) >= 100
                        ? "bg-gradient-to-r from-emerald-600 to-teal-400"
                        : "bg-gradient-to-r from-amber-500 to-emerald-500"
                    }`}
                    style={{ width: `${Math.min(100, breakEvenProgress ?? 0)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>
                {breakEvenRemaining !== null && breakEvenRemaining === 0 ? "Statut :" : "Reste à vendre :"}
              </span>
              <strong
                className={
                  breakEvenRemaining !== null && breakEvenRemaining === 0
                    ? "text-emerald-600 dark:text-emerald-400 font-bold"
                    : "text-amber-600 dark:text-amber-400 font-bold"
                }
              >
                {breakEvenRemaining !== null && breakEvenRemaining === 0
                  ? "Point mort dépassé ✓"
                  : breakEvenRemaining === null ? "Non calculable" : formatMoney(breakEvenRemaining, currency)}
              </strong>
            </div>
          </article>
        )}

        {/* ── CARD 3: Runway de Trésorerie (Autonomie) ── */}
        {(activeTab === "all" || activeTab === "cashflow") && (
          <article className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-emerald-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Autonomie Trésorerie (Runway)
                </span>
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    (runwayDays ?? -1) >= 60
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                      : (runwayDays ?? -1) >= 20
                      ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                      : "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                  }`}
                >
                  <Hourglass size={16} />
                </div>
              </div>

              <div className="flex items-baseline gap-1.5 mb-1">
                <strong
                  className={`text-xl sm:text-2xl font-semibold tracking-tight ${
                    (runwayDays ?? -1) >= 60
                      ? "text-emerald-700 dark:text-emerald-400"
                      : (runwayDays ?? -1) >= 20
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {(runwayDays ?? -1) >= 999 ? "Illimité" : runwayDays === null ? "À compléter" : `${runwayDays} jours`}
                </strong>
                {runwayDays === null && <span className="text-[11px] text-slate-500">{missing("cash_runway_days", "Solde et historique insuffisants.")}</span>}
                {runwayDays !== null && runwayDays < 999 && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    d&apos;autonomie
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black ${
                    (runwayDays ?? -1) >= 60
                      ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300"
                      : (runwayDays ?? -1) >= 20
                      ? "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300"
                      : "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300"
                  }`}
                >
                  {(runwayDays ?? -1) >= 60
                    ? "Confortable"
                    : (runwayDays ?? -1) >= 20
                    ? "Sous surveillance"
                    : runwayDays === null ? "Non calculable" : "Critique"}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  sans nouvelle entrée
                </span>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Dépense quotidienne :</span>
              <strong className="text-slate-800 dark:text-slate-200">
                {dailyBurn === null ? "Non calculable" : `~${formatMoney(dailyBurn, currency)} / j`}
              </strong>
            </div>
          </article>
        )}

        {/* ── CARD 4: Panier Moyen (AOV) & Efficacité Commerciale ── */}
        {(activeTab === "all" || activeTab === "profitability") && (
          <article className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-emerald-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Panier Moyen (AOV)
                </span>
                <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <ReceiptText size={16} />
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-1">
                <strong className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
                  {formatMoney(aov, currency)}
                </strong>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300">
                  {totalSalesCount} vente(s) enregistrée(s)
                </span>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Encaissement moyen :</span>
              <strong className="text-slate-800 dark:text-slate-200">
                {totalSalesCount > 0 ? formatMoney(Math.round(totalPaid / totalSalesCount), currency) : "0"}
              </strong>
            </div>
          </article>
        )}

        {/* ── CARD 5: Qualité du Recouvrement & Impayés ── */}
        {(activeTab === "all" || activeTab === "cashflow") && (
          <article className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-emerald-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Taux de Recouvrement
                </span>
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    (recoveryRate ?? 0) >= 80
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                      : "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  <Activity size={16} />
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-1">
                <strong
                  className={`text-xl sm:text-2xl font-semibold tracking-tight ${
                    (recoveryRate ?? 0) >= 80
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {recoveryRate === null ? "Non calculable" : `${recoveryRate}%`}
                </strong>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  encaissé
                </span>
              </div>

              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Argent dehors (Clients) :
                </span>
                <strong className="text-[11px] text-amber-700 dark:text-amber-400 font-black">
                  {formatMoney(totalUnpaid, currency)}
                </strong>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] flex items-center justify-between">
              <Link
                href="/espace/ventes"
                className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1"
              >
                <span>Relancer les impayés</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </article>
        )}

        {/* ── CARD 6: Fonds de Roulement Net (FRNG) ── */}
        {(activeTab === "all" || activeTab === "cashflow") && (
          <article className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-emerald-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Fonds de Roulement Net
                </span>
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Layers size={16} />
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-1">
                <strong
                  className={`text-xl sm:text-2xl font-semibold tracking-tight ${
                    workingCapital === null || workingCapital >= 0
                      ? "text-indigo-700 dark:text-indigo-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {workingCapital === null ? "À compléter" : formatMoney(workingCapital, currency)}
                </strong>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
                {missing("working_capital", "Bilan comptable à compléter.")}
              </p>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Dettes fournisseurs :</span>
              <strong className="text-slate-800 dark:text-slate-200">
                {formatMoney(totalExpensesUnpaid, currency)}
              </strong>
            </div>
          </article>
        )}
      </div>
    </section>
  );
}
