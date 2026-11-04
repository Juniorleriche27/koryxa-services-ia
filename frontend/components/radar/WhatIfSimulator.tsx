"use client";

import React from "react";
import {
  SimulationParams,
  TreasuryHealthStatus,
  formatTreasuryMoney,
} from "@/lib/radar/cashflow-projection";
import {
  Sliders,
  RotateCcw,
  Zap,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Clock,
} from "lucide-react";

interface WhatIfSimulatorProps {
  params: SimulationParams;
  onChange: (updated: SimulationParams) => void;
  onReset: () => void;
  currency?: string;
  baselineRunwayDays: number;
  simulatedRunwayDays: number;
  deltaRunwayDays: number;
  healthStatus: TreasuryHealthStatus;
  simulatedHealthStatus: TreasuryHealthStatus;
  totalOverdueReceivables: number;
}

export function WhatIfSimulator({
  params,
  onChange,
  onReset,
  currency = "XOF",
  baselineRunwayDays,
  simulatedRunwayDays,
  deltaRunwayDays,
  healthStatus,
  simulatedHealthStatus,
  totalOverdueReceivables,
}: WhatIfSimulatorProps) {
  const isModified =
    params.additionalInflow > 0 ||
    params.deferExpensesDays > 0 ||
    params.expenseReductionPct !== 0 ||
    params.recoveryCollectionPct > 0;

  // Presets intelligents 1-clic
  const applyPreset = (preset: Partial<SimulationParams>) => {
    onChange({
      ...params,
      ...preset,
    });
  };

  const getStatusColor = (status: TreasuryHealthStatus) => {
    switch (status) {
      case "healthy":
        return "#22c55e";
      case "warning":
        return "#f59e0b";
      case "danger":
        return "#ef4444";
    }
  };

  return (
    <div
      className="cauri-whatif-simulator"
      style={{
        background: "linear-gradient(180deg, #131d31 0%, #0c1220 100%)",
        borderRadius: "18px",
        padding: "20px",
        border: "1px solid rgba(56, 189, 248, 0.15)",
        color: "#f8fafc",
      }}
    >
      {/* En-tête du simulateur */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "16px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          paddingBottom: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              backgroundColor: "rgba(56, 189, 248, 0.15)",
              color: "#38bdf8",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Sliders size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#ffffff" }}>
              Simulateur de Résilience &quot;What-If&quot;
            </h3>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>
              Testez l&apos;impact de vos décisions financières en temps réel sans affecter les registres
            </span>
          </div>
        </div>

        {isModified && (
          <button
            type="button"
            onClick={onReset}
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#cbd5e1",
              borderRadius: "8px",
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "0.2s ease",
            }}
          >
            <RotateCcw size={14} />
            <span>Réinitialiser</span>
          </button>
        )}
      </div>

      {/* Résumé de l'impact simulé */}
      <div
        style={{
          background: isModified ? "rgba(56, 189, 248, 0.08)" : "rgba(255, 255, 255, 0.03)",
          border: isModified ? "1px solid rgba(56, 189, 248, 0.25)" : "1px solid rgba(255, 255, 255, 0.06)",
          borderRadius: "14px",
          padding: "14px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <div>
          <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#94a3b8", fontWeight: 700 }}>
            Runway Projeté (Survie en trésorerie)
          </span>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginTop: "4px" }}>
            <span
              style={{
                fontSize: "24px",
                fontWeight: 800,
                color: getStatusColor(simulatedHealthStatus),
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {simulatedRunwayDays} jours
            </span>
            <span style={{ fontSize: "13px", color: "#64748b" }}>
              (vs {baselineRunwayDays}j réel)
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {deltaRunwayDays > 0 ? (
            <div
              style={{
                background: "rgba(34, 197, 94, 0.15)",
                color: "#22c55e",
                padding: "6px 12px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                gap: "5px",
                border: "1px solid rgba(34, 197, 94, 0.3)",
              }}
            >
              <TrendingUp size={14} />
              <span>+{deltaRunwayDays} jours gagnés</span>
            </div>
          ) : deltaRunwayDays < 0 ? (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.15)",
                color: "#ef4444",
                padding: "6px 12px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                gap: "5px",
                border: "1px solid rgba(239, 68, 68, 0.3)",
              }}
            >
              <AlertCircle size={14} />
              <span>{deltaRunwayDays} jours de répit</span>
            </div>
          ) : (
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>Scénario de base</span>
          )}

          {simulatedHealthStatus === "healthy" && baselineRunwayDays < 30 && (
            <div
              style={{
                background: "rgba(56, 189, 248, 0.15)",
                color: "#38bdf8",
                padding: "6px 12px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <ShieldCheck size={14} />
              <span>Rupture écartée</span>
            </div>
          )}
        </div>
      </div>

      {/* Presets rapides */}
      <div style={{ marginBottom: "18px" }}>
        <div style={{ fontSize: "11px", textTransform: "uppercase", color: "#94a3b8", fontWeight: 700, marginBottom: "8px" }}>
          Scénarios Rapides 1-Clic
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "8px",
          }}
        >
          <button
            type="button"
            onClick={() => applyPreset({ additionalInflow: 500000 })}
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "10px",
              padding: "8px 12px",
              color: "#f1f5f9",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Zap size={14} color="#22c55e" />
            <span>+500k Acompte</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset({ deferExpensesDays: 15 })}
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "10px",
              padding: "8px 12px",
              color: "#f1f5f9",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Clock size={14} color="#38bdf8" />
            <span>Report Fournisseurs +15j</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset({ expenseReductionPct: 20 })}
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "10px",
              padding: "8px 12px",
              color: "#f1f5f9",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <ShieldCheck size={14} color="#f59e0b" />
            <span>Charges -20%</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset({ recoveryCollectionPct: 80 })}
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "10px",
              padding: "8px 12px",
              color: "#f1f5f9",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <TrendingUp size={14} color="#10b981" />
            <span>Recouvrement 80%</span>
          </button>
        </div>
      </div>

      {/* Contrôles / Sliders */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px",
        }}
      >
        {/* Curseur 1 : Injection immédiate */}
        <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "12px", borderRadius: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
            <span style={{ color: "#cbd5e1" }}>Acompte / Trésorerie injectée</span>
            <strong style={{ color: "#22c55e", fontVariantNumeric: "tabular-nums" }}>
              +{formatTreasuryMoney(params.additionalInflow, currency)}
            </strong>
          </div>
          <input
            type="range"
            min="0"
            max="3000000"
            step="50000"
            value={params.additionalInflow}
            onChange={(e) => onChange({ ...params, additionalInflow: Number(e.target.value) })}
            style={{ width: "100%", accentColor: "#22c55e", cursor: "pointer" }}
            aria-label="Injection de trésorerie"
          />
        </div>

        {/* Curseur 2 : Décalage fournisseurs */}
        <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "12px", borderRadius: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
            <span style={{ color: "#cbd5e1" }}>Report décaissements fournisseurs</span>
            <strong style={{ color: "#38bdf8", fontVariantNumeric: "tabular-nums" }}>
              {params.deferExpensesDays} jours
            </strong>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            step="1"
            value={params.deferExpensesDays}
            onChange={(e) => onChange({ ...params, deferExpensesDays: Number(e.target.value) })}
            style={{ width: "100%", accentColor: "#38bdf8", cursor: "pointer" }}
            aria-label="Report décaissements fournisseurs"
          />
        </div>

        {/* Curseur 3 : Réduction des charges */}
        <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "12px", borderRadius: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
            <span style={{ color: "#cbd5e1" }}>Optimisation des charges d&apos;exploitation</span>
            <strong
              style={{
                color: params.expenseReductionPct >= 0 ? "#f59e0b" : "#ef4444",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {params.expenseReductionPct > 0 ? `-${params.expenseReductionPct}%` : `${params.expenseReductionPct}%`}
            </strong>
          </div>
          <input
            type="range"
            min="-30"
            max="40"
            step="5"
            value={params.expenseReductionPct}
            onChange={(e) => onChange({ ...params, expenseReductionPct: Number(e.target.value) })}
            style={{ width: "100%", accentColor: "#f59e0b", cursor: "pointer" }}
            aria-label="Optimisation des charges d'exploitation"
          />
        </div>

        {/* Curseur 4 : Taux de recouvrement des impayés */}
        <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "12px", borderRadius: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
            <span style={{ color: "#cbd5e1" }}>Recouvrement créances en souffrance</span>
            <strong style={{ color: "#a855f7", fontVariantNumeric: "tabular-nums" }}>
              {params.recoveryCollectionPct}%
            </strong>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="10"
            value={params.recoveryCollectionPct}
            onChange={(e) => onChange({ ...params, recoveryCollectionPct: Number(e.target.value) })}
            style={{ width: "100%", accentColor: "#a855f7", cursor: "pointer" }}
            aria-label="Taux de recouvrement des impayés"
          />
        </div>
      </div>
    </div>
  );
}
