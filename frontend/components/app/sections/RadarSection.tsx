"use client";

import React, { useState, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import {
  Play,
  Radar as RadarIcon,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { PageHeader } from "../PageHeader";
import { EmptyState, StatusPill, TableSkeleton } from "../Ui";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { formatLabel, SaleItem } from "../RegistersTable";
import {
  CashflowSummaryData,
  SimulationParams,
  computeCashflowProjection,
  formatTreasuryMoney,
  ReceivableItem,
} from "@/lib/radar/cashflow-projection";
import { PredictiveCashflowChart } from "@/components/radar/PredictiveCashflowChart";
import { WhatIfSimulator } from "@/components/radar/WhatIfSimulator";
import { ReceivablesRecoveryRadar } from "@/components/radar/ReceivablesRecoveryRadar";

export type AlertItem = {
  id: string;
  title: string;
  explanation: string;
  priority: string;
  dimension: string;
  status: string;
  confidence: number;
};

const DEFAULT_SIMULATION: SimulationParams = {
  additionalInflow: 0,
  deferExpensesDays: 0,
  expenseReductionPct: 0,
  recoveryCollectionPct: 0,
};

export function RadarSection({
  data,
  loading,
  error,
  onReload,
  cashflowData,
  unpaidSales = [],
  organizationName = "CAURI",
}: {
  data: AlertItem[] | null;
  loading: boolean;
  error: string;
  onReload: () => Promise<void>;
  cashflowData?: CashflowSummaryData | null;
  unpaidSales?: SaleItem[];
  organizationName?: string;
}) {
  const { t, lang } = useI18n();
  const [running, setRunning] = useState(false);
  const [simParams, setSimParams] = useState<SimulationParams>(DEFAULT_SIMULATION);

  const run = async () => {
    setRunning(true);
    try {
      await serviceIaFetch("/radar/runs", { method: "POST" });
      await onReload();
    } finally {
      setRunning(false);
    }
  };

  const update = async (id: string, status: string) => {
    await serviceIaFetch(`/radar/alerts/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await onReload();
  };

  const createActionFromAlert = async (a: AlertItem) => {
    await serviceIaFetch("/workflow/actions", {
      method: "POST",
      body: JSON.stringify({
        alert_id: a.id,
        title: a.title,
        description: a.explanation,
        priority: a.priority,
      }),
    });
    await update(a.id, "acknowledged");
  };

  // Convertit les sales en receivable items pour le moteur de calcul
  const receivablesForProjection: ReceivableItem[] = useMemo(() => {
    return unpaidSales.map((s) => ({
      id: s.id,
      reference: s.reference,
      client_name: s.client_name,
      client_phone: s.client_phone,
      item_label: s.item_label,
      total_amount: s.total_amount,
      paid_amount: s.paid_amount,
      due_date: s.due_date,
      sale_date: s.sale_date,
      public_token: s.public_token,
      currency: s.currency,
    }));
  }, [unpaidSales]);

  // Calcul du Cashflow et de la projection
  const projection = useMemo(() => {
    return computeCashflowProjection(cashflowData || null, receivablesForProjection, simParams);
  }, [cashflowData, receivablesForProjection, simParams]);

  const isSimulating =
    simParams.additionalInflow > 0 ||
    simParams.deferExpensesDays > 0 ||
    simParams.expenseReductionPct !== 0 ||
    simParams.recoveryCollectionPct > 0;

  const currency = projection.currency;

  return (
    <>
      <PageHeader
        eyebrow="RADAR ET CONTRÔLE / TRÉSORERIE & RISQUES"
        title="Surveillance et alertes"
        description="Radar de trésorerie prédictif, surveillance du runway 30 jours, simulation What-If et relance 1-clic des impayés."
        action={
          <button
            className="app-button app-button-primary"
            disabled={running}
            onClick={run}
            style={{ minHeight: "44px" }}
          >
            <Play size={16} />
            <span>{running ? t("radar_running") : t("radar_btn_scan")}</span>
          </button>
        }
      />

      {loading && !data && !cashflowData && <TableSkeleton />}
      {error && !data && <EmptyState title={t("common_error")} detail={error} onRetry={onReload} />}

      {/* 1. LIGNE DES 4 KPIS FINANCIERS DU COCKPIT */}
      <section
        className="app-metrics"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px",
          marginBottom: "20px",
        }}
        aria-label="Indicateurs clés de trésorerie"
      >
        {/* KPI 1 : Runway Trésorerie */}
        <div className="app-metric" style={{ position: "relative" }}>
          <div>
            <span>Runway de Trésorerie</span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                padding: "2px 8px",
                borderRadius: "999px",
                backgroundColor:
                  projection.healthStatus === "healthy"
                    ? "rgba(34, 197, 94, 0.15)"
                    : projection.healthStatus === "warning"
                    ? "rgba(245, 158, 11, 0.15)"
                    : "rgba(239, 68, 68, 0.15)",
                color:
                  projection.healthStatus === "healthy"
                    ? "#16a34a"
                    : projection.healthStatus === "warning"
                    ? "#d97706"
                    : "#dc2626",
              }}
            >
              {projection.healthStatus === "healthy"
                ? "Saine (>30j)"
                : projection.healthStatus === "warning"
                ? "Tension (10-30j)"
                : "Alerte Rupture (<10j)"}
            </span>
          </div>
          <strong style={{ fontVariantNumeric: "tabular-nums" }}>
            {projection.baselineRunwayDays} jours
          </strong>
          <small>
            Burn rate : ~{formatTreasuryMoney(projection.dailyBurnRate, currency)}/j
          </small>
          <div className="app-meter">
            <i
              style={{
                width: `${Math.min(100, (projection.baselineRunwayDays / 60) * 100)}%`,
                background:
                  projection.healthStatus === "healthy"
                    ? "linear-gradient(90deg, #22c55e, #10b981)"
                    : projection.healthStatus === "warning"
                    ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                    : "linear-gradient(90deg, #ef4444, #f87171)",
              }}
            />
          </div>
        </div>

        {/* KPI 2 : Solde Net d'Opérations */}
        <div className="app-metric">
          <div>
            <span>Solde Net d&apos;Opérations</span>
            <Wallet size={16} color="#00a86b" />
          </div>
          <strong style={{ fontVariantNumeric: "tabular-nums" }}>
            {formatTreasuryMoney(projection.startingBalance, currency)}
          </strong>
          <small style={{ display: "flex", gap: "8px" }}>
            <span style={{ color: "#16a34a" }}>
              +{formatTreasuryMoney(Number(cashflowData?.total_income_paid || 0), currency)}
            </span>
            <span style={{ color: "#dc2626" }}>
              -{formatTreasuryMoney(Number(cashflowData?.total_expenses_paid || 0), currency)}
            </span>
          </small>
          <div className="app-meter">
            <i style={{ width: "100%", background: "#00a86b" }} />
          </div>
        </div>

        {/* KPI 3 : Créances Clients en Souffrance */}
        <div className="app-metric">
          <div>
            <span>Créances en Retard</span>
            <Clock size={16} color="#f59e0b" />
          </div>
          <strong style={{ color: "#d97706", fontVariantNumeric: "tabular-nums" }}>
            {formatTreasuryMoney(projection.totalOverdueReceivables, currency)}
          </strong>
          <small>
            À échoir : {formatTreasuryMoney(Number(cashflowData?.receivables_not_due || 0), currency)}
          </small>
          <div className="app-meter">
            <i
              style={{
                width: `${Math.min(
                  100,
                  projection.totalOverdueReceivables > 0 ? 80 : 0
                )}%`,
                background: "#f59e0b",
              }}
            />
          </div>
        </div>

        {/* KPI 4 : Dépenses & Dettes Fournisseurs */}
        <div className="app-metric">
          <div>
            <span>Dépenses en Attente</span>
            <AlertTriangle size={16} color="#ef4444" />
          </div>
          <strong style={{ color: "#ef4444", fontVariantNumeric: "tabular-nums" }}>
            {formatTreasuryMoney(projection.totalPendingPayables, currency)}
          </strong>
          <small>Engagements d&apos;achats déclarés</small>
          <div className="app-meter">
            <i
              style={{
                width: `${Math.min(
                  100,
                  projection.totalPendingPayables > 0 ? 65 : 0
                )}%`,
                background: "#ef4444",
              }}
            />
          </div>
        </div>
      </section>

      {/* 2. ÉTAGE CENTRAL : GRAPHIQUE PRÉDICTIF 30 JOURS & SIMULATEUR WHAT-IF */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
          gap: "18px",
          marginBottom: "24px",
        }}
        aria-label="Simulation et projection prédictive"
      >
        <PredictiveCashflowChart
          points={projection.points}
          currency={currency}
          isSimulating={isSimulating}
          healthStatus={projection.healthStatus}
          simulatedHealthStatus={projection.simulatedHealthStatus}
          ruptureDayIndex={projection.ruptureDayIndex}
          simulatedRuptureDayIndex={projection.simulatedRuptureDayIndex}
        />

        <WhatIfSimulator
          params={simParams}
          onChange={setSimParams}
          onReset={() => setSimParams(DEFAULT_SIMULATION)}
          currency={currency}
          baselineRunwayDays={projection.baselineRunwayDays}
          simulatedRunwayDays={projection.simulatedRunwayDays}
          deltaRunwayDays={projection.deltaRunwayDays}
          healthStatus={projection.healthStatus}
          simulatedHealthStatus={projection.simulatedHealthStatus}
          totalOverdueReceivables={projection.totalOverdueReceivables}
        />
      </section>

      {/* 3. ÉTAGE INFÉRIEUR : RADAR DE RECOUVREMENT 1-CLIC & ALERTES OPÉRATIONNELLES */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
          gap: "18px",
          marginBottom: "24px",
        }}
        aria-label="Actions de recouvrement et alertes"
      >
        {/* Radar de Recouvrement 1-Clic WhatsApp */}
        <ReceivablesRecoveryRadar
          receivables={receivablesForProjection}
          currency={currency}
          organizationName={organizationName}
        />

        {/* Alertes Opérationnelles & Détections Système */}
        <div
          className="app-panel cauri-radar-alerts"
          style={{
            margin: 0,
            display: "flex",
            flexDirection: "column",
          }}
          aria-label="Signaux et alertes opérationnelles"
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "14px",
              borderBottom: "1px solid #eef5f1",
              paddingBottom: "12px",
            }}
          >
            <div>
              <strong style={{ fontSize: "16px", color: "#111827", display: "block" }}>
                Signaux d&apos;Audit & Alertes IA
              </strong>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Anomalies détectées par le moteur de contrôle continu
              </span>
            </div>
            {data && data.length > 0 && (
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 800,
                  padding: "4px 10px",
                  borderRadius: "999px",
                  backgroundColor: "#fef3c7",
                  color: "#b45309",
                }}
              >
                {data.length} signal{data.length > 1 ? "aux" : ""}
              </span>
            )}
          </div>

          {!data || data.length === 0 ? (
            <div
              style={{
                padding: "32px 20px",
                textAlign: "center",
                backgroundColor: "#f9fcfa",
                borderRadius: "14px",
                border: "1px dashed #d1e7dc",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: "#e8f8f0",
                  color: "#00a86b",
                  display: "grid",
                  placeItems: "center",
                  margin: "0 auto 10px",
                }}
              >
                <ShieldCheck size={20} />
              </div>
              <strong style={{ fontSize: "14px", color: "#1e293b", marginBottom: "4px" }}>
                Aucune anomalie détectée
              </strong>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                Lancez un scan pour vérifier la cohérence des prix, échéances et encaissements.
              </p>
            </div>
          ) : (
            <div className="app-alert-list" style={{ maxHeight: "420px", overflowY: "auto" }}>
              {data.map((a) => (
                <article className="app-alert app-alert-large" key={a.id}>
                  <RadarIcon size={18} />
                  <div>
                    <strong>{a.title}</strong>
                    <p>{a.explanation}</p>
                    <div className="app-alert-tags">
                      <span>{formatLabel(a.dimension, lang)}</span>
                      <span>{formatLabel(a.status, lang)}</span>
                    </div>
                  </div>
                  <StatusPill>{formatLabel(a.priority, lang)}</StatusPill>
                  <div className="app-row-actions">
                    {a.status !== "resolved" && (
                      <button
                        className="app-button app-button-secondary"
                        onClick={() => void createActionFromAlert(a)}
                        style={{ minHeight: "36px" }}
                      >
                        Créer une action
                      </button>
                    )}
                    {a.status !== "resolved" && (
                      <button
                        className="app-text-button"
                        onClick={() => void update(a.id, "resolved")}
                        style={{ minHeight: "36px" }}
                      >
                        Résoudre
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
