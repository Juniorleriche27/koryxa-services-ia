"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Hourglass,
  Activity,
  ShieldAlert,
  ShieldCheck,
  Percent,
  ReceiptText,
  AlertTriangle,
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
  estimatedGrossMargin?: number;
  grossMarginRate?: number;
  averageOrderValue?: number;
  breakEvenPoint?: number;
  breakEvenProgress?: number;
  recoveryRate?: number;
  dailyBurnRate?: number;
  cashRunwayDays?: number;
  workingCapital?: number;
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
}: BusinessPerformanceProps) {
  const [activeTab, setActiveTab] = useState<"all" | "profitability" | "cashflow">("all");

  // --- Computed metrics with safe fallbacks ---
  const grossMargin =
    propGrossMargin !== undefined ? Number(propGrossMargin) : totalSales - totalExpensesPaid;
  const marginRate =
    propMarginRate !== undefined
      ? Number(propMarginRate)
      : totalSales > 0
      ? Math.round(((totalSales - totalExpensesPaid) / totalSales) * 1000) / 10
      : 0;
  const aov =
    propAov !== undefined
      ? Number(propAov)
      : totalSalesCount > 0
      ? Math.round(totalSales / totalSalesCount)
      : 0;

  const totalCharges = totalExpensesPaid + totalExpensesUnpaid;
  const breakEvenPoint = propBreakEven !== undefined ? Number(propBreakEven) : totalCharges;
  const breakEvenProgress =
    propBreakEvenProgress !== undefined
      ? Number(propBreakEvenProgress)
      : breakEvenPoint > 0
      ? Math.min(100, Math.round((totalSales / breakEvenPoint) * 1000) / 10)
      : 100;
  const breakEvenRemaining = Math.max(0, breakEvenPoint - totalSales);

  const recoveryRate =
    propRecoveryRate !== undefined
      ? Number(propRecoveryRate)
      : totalSales > 0
      ? Math.min(100, Math.round((totalPaid / totalSales) * 1000) / 10)
      : 100;

  const dailyBurn =
    propDailyBurn !== undefined
      ? Number(propDailyBurn)
      : totalExpensesPaid > 0
      ? Math.round(totalExpensesPaid / 30)
      : 0;

  let runwayDays = 0;
  if (propRunwayDays !== undefined) {
    runwayDays = propRunwayDays;
  } else if (netCash > 0 && dailyBurn > 0) {
    runwayDays = Math.round(netCash / dailyBurn);
  } else if (netCash > 0) {
    runwayDays = 999;
  }

  const workingCapital =
    propWorkingCapital !== undefined
      ? Number(propWorkingCapital)
      : netCash + totalUnpaid - totalExpensesUnpaid;

  // --- Diagnostic status ---
  let diagnosticStatus: "success" | "warning" | "alert" = "success";
  let diagnosticTitle = "Exploitation équilibrée";
  let diagnosticDetail = "Flux stables · Aucune action urgente";

  if (runwayDays > 0 && runwayDays < 20) {
    diagnosticStatus = "alert";
    diagnosticTitle = "Trésorerie critique";
    diagnosticDetail = `${runwayDays} j de runway · Relancer les créances (${formatMoney(totalUnpaid, currency)})`;
  } else if (grossMargin < 0) {
    diagnosticStatus = "alert";
    diagnosticTitle = "Déficit d'exploitation";
    diagnosticDetail = `Charges > Ventes de ${formatMoney(Math.abs(grossMargin), currency)}`;
  } else if (breakEvenProgress < 100 && breakEvenRemaining > 0) {
    diagnosticStatus = "warning";
    diagnosticTitle = `Point mort à ${breakEvenProgress}%`;
    diagnosticDetail = `Reste ${formatMoney(breakEvenRemaining, currency)} à réaliser`;
  } else if (recoveryRate < 60 && totalUnpaid > 0) {
    diagnosticStatus = "warning";
    diagnosticTitle = `Recouvrement faible (${recoveryRate}%)`;
    diagnosticDetail = `${formatMoney(totalUnpaid, currency)} non encaissés`;
  } else if (grossMargin > 0 && breakEvenProgress >= 100) {
    diagnosticStatus = "success";
    diagnosticTitle = "Rentabilité atteinte";
    diagnosticDetail = `Marge ${marginRate}% · Point mort dépassé`;
  }

  const statusColor = {
    alert: {
      banner: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50",
      icon: "bg-rose-500 text-white",
      label: "text-rose-600 dark:text-rose-400",
    },
    warning: {
      banner: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50",
      icon: "bg-amber-500 text-white",
      label: "text-amber-600 dark:text-amber-400",
    },
    success: {
      banner: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50",
      icon: "bg-emerald-600 text-white",
      label: "text-emerald-600 dark:text-emerald-400",
    },
  }[diagnosticStatus];

  return (
    <section className="mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Pilotage Exécutif
          </span>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
            Performance &amp; Rentabilité
          </h2>
        </div>

        {/* Tabs */}
        <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
          {(["all", "profitability", "cashflow"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === tab
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              {tab === "all" ? "Vue Globale" : tab === "profitability" ? "Rentabilité" : "Trésorerie"}
            </button>
          ))}
        </div>
      </div>

      {/* Diagnostic Banner — compact, no AI branding */}
      <div className={`mb-4 px-4 py-3 rounded-xl border flex items-center gap-3 ${statusColor.banner}`}>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${statusColor.icon}`}>
          {diagnosticStatus === "alert" ? (
            <ShieldAlert size={15} />
          ) : diagnosticStatus === "warning" ? (
            <AlertTriangle size={15} />
          ) : (
            <ShieldCheck size={15} />
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className={`text-xs font-bold shrink-0 ${statusColor.label}`}>
            {diagnosticTitle}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
            {diagnosticDetail}
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3">

        {/* ── Marge Brute ── */}
        {(activeTab === "all" || activeTab === "profitability") && (
          <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-3 hover:border-emerald-400/60 dark:hover:border-emerald-600/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Marge Brute</span>
              <div className={`w-6 h-6 rounded-md flex items-center justify-center ${grossMargin >= 0 ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-950/50 text-rose-500"}`}>
                {grossMargin >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              </div>
            </div>
            <div>
              <p className={`text-xl font-bold tracking-tight ${grossMargin >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-600 dark:text-rose-400"}`}>
                {formatMoney(grossMargin, currency)}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                  marginRate >= 30
                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                    : marginRate >= 10
                    ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                    : "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300"
                }`}>
                  <Percent size={10} />
                  {marginRate}%
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">de marge</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
              <span>CA</span>
              <span className="font-semibold text-slate-600 dark:text-slate-300">{formatMoney(totalSales, currency)}</span>
            </div>
          </article>
        )}

        {/* ── Point Mort ── */}
        {(activeTab === "all" || activeTab === "profitability") && (
          <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-3 hover:border-emerald-400/60 dark:hover:border-emerald-600/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Point Mort</span>
              <div className="w-6 h-6 rounded-md flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                <Scale size={13} />
              </div>
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {formatMoney(breakEvenPoint, currency)}
              </p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400 dark:text-slate-500">Couverture</span>
                  <span className={`font-semibold ${breakEvenProgress >= 100 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>{breakEvenProgress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${breakEvenProgress >= 100 ? "bg-emerald-500" : "bg-amber-400"}`}
                    style={{ width: `${Math.min(100, breakEvenProgress)}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 dark:text-slate-500">{breakEvenRemaining === 0 ? "Statut" : "Reste"}</span>
              <span className={`font-semibold ${breakEvenRemaining === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                {breakEvenRemaining === 0 ? "Dépassé" : formatMoney(breakEvenRemaining, currency)}
              </span>
            </div>
          </article>
        )}

        {/* ── Panier Moyen ── */}
        {(activeTab === "all" || activeTab === "profitability") && (
          <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-3 hover:border-emerald-400/60 dark:hover:border-emerald-600/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Panier Moyen</span>
              <div className="w-6 h-6 rounded-md flex items-center justify-center bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
                <ReceiptText size={13} />
              </div>
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {formatMoney(aov, currency)}
              </p>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">{totalSalesCount} vente{totalSalesCount > 1 ? "s" : ""}</span>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
              <span>Encaissé / vente</span>
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                {totalSalesCount > 0 ? formatMoney(Math.round(totalPaid / totalSalesCount), currency) : "—"}
              </span>
            </div>
          </article>
        )}

        {/* ── Runway Trésorerie ── */}
        {(activeTab === "all" || activeTab === "cashflow") && (
          <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-3 hover:border-emerald-400/60 dark:hover:border-emerald-600/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Autonomie Trésorerie</span>
              <div className={`w-6 h-6 rounded-md flex items-center justify-center ${runwayDays >= 60 ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400" : runwayDays >= 20 ? "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400" : "bg-rose-50 dark:bg-rose-950/50 text-rose-500"}`}>
                <Hourglass size={13} />
              </div>
            </div>
            <div>
              <p className={`text-xl font-bold tracking-tight ${runwayDays >= 60 ? "text-emerald-700 dark:text-emerald-300" : runwayDays >= 20 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"}`}>
                {runwayDays >= 999 ? "Illimité" : `${runwayDays} j`}
              </p>
              <span className={`text-[11px] font-semibold mt-1 block ${runwayDays >= 60 ? "text-emerald-600 dark:text-emerald-400" : runwayDays >= 20 ? "text-amber-500 dark:text-amber-400" : "text-rose-500"}`}>
                {runwayDays >= 60 ? "Confortable" : runwayDays >= 20 ? "Sous surveillance" : "Critique"}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
              <span>Burn / jour</span>
              <span className="font-semibold text-slate-600 dark:text-slate-300">~{formatMoney(dailyBurn, currency)}</span>
            </div>
          </article>
        )}

        {/* ── Taux de Recouvrement ── */}
        {(activeTab === "all" || activeTab === "cashflow") && (
          <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-3 hover:border-emerald-400/60 dark:hover:border-emerald-600/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Recouvrement</span>
              <div className={`w-6 h-6 rounded-md flex items-center justify-center ${recoveryRate >= 80 ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400" : "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400"}`}>
                <Activity size={13} />
              </div>
            </div>
            <div>
              <p className={`text-xl font-bold tracking-tight ${recoveryRate >= 80 ? "text-emerald-700 dark:text-emerald-300" : "text-amber-600 dark:text-amber-400"}`}>
                {recoveryRate}%
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[11px] text-slate-400 dark:text-slate-500">Non encaissé :</span>
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">{formatMoney(totalUnpaid, currency)}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              <Link href="/espace/ventes" className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
                Relancer les impayés
                <ArrowRight size={11} />
              </Link>
            </div>
          </article>
        )}

        {/* ── Fonds de Roulement ── */}
        {(activeTab === "all" || activeTab === "cashflow") && (
          <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-3 hover:border-emerald-400/60 dark:hover:border-emerald-600/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Fonds de Roulement</span>
              <div className="w-6 h-6 rounded-md flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <Layers size={13} />
              </div>
            </div>
            <div>
              <p className={`text-xl font-bold tracking-tight ${workingCapital >= 0 ? "text-indigo-700 dark:text-indigo-300" : "text-rose-600 dark:text-rose-400"}`}>
                {formatMoney(workingCapital, currency)}
              </p>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">Liquidités – Dettes fournisseurs</span>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
              <span>Dettes fourn.</span>
              <span className="font-semibold text-slate-600 dark:text-slate-300">{formatMoney(totalExpensesUnpaid, currency)}</span>
            </div>
          </article>
        )}

      </div>
    </section>
  );
}
