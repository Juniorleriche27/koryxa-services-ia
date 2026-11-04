"use client";

import React, { useState, useId, useMemo } from "react";
import {
  DailyProjectionPoint,
  formatTreasuryMoney,
  TreasuryHealthStatus,
} from "@/lib/radar/cashflow-projection";
import { AlertTriangle, TrendingUp, ShieldCheck, Info } from "lucide-react";

interface PredictiveCashflowChartProps {
  points: DailyProjectionPoint[];
  currency?: string;
  isSimulating?: boolean;
  healthStatus: TreasuryHealthStatus;
  simulatedHealthStatus?: TreasuryHealthStatus;
  ruptureDayIndex: number | null;
  simulatedRuptureDayIndex?: number | null;
}

export function PredictiveCashflowChart({
  points,
  currency = "XOF",
  isSimulating = false,
  healthStatus,
  simulatedHealthStatus,
  ruptureDayIndex,
  simulatedRuptureDayIndex,
}: PredictiveCashflowChartProps) {
  const gradientId = useId();
  const simGradientId = useId();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Dimensions SVG
  const width = 800;
  const height = 320;
  const padding = { top: 30, right: 30, bottom: 40, left: 75 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Calcul des extremums
  const { minVal, maxVal, zeroY } = useMemo(() => {
    let min = 0;
    let max = 100000;
    points.forEach((p) => {
      if (p.baselineBalance < min) min = p.baselineBalance;
      if (p.baselineBalance > max) max = p.baselineBalance;
      if (isSimulating) {
        if (p.simulatedBalance < min) min = p.simulatedBalance;
        if (p.simulatedBalance > max) max = p.simulatedBalance;
      }
    });
    // Marge de 10%
    const span = max - min || 1;
    const adjustedMax = max + span * 0.1;
    const adjustedMin = min < 0 ? min - span * 0.1 : 0;

    // Position Y du niveau Zéro
    const zeroRatio = (0 - adjustedMin) / (adjustedMax - adjustedMin);
    const zeroY = padding.top + chartH * (1 - zeroRatio);

    return { minVal: adjustedMin, maxVal: adjustedMax, zeroY };
  }, [points, isSimulating, chartH, padding.top]);

  // Échelle X & Y
  const getX = (index: number) => padding.left + (index / (points.length - 1)) * chartW;
  const getY = (val: number) => {
    const ratio = (val - minVal) / (maxVal - minVal || 1);
    return padding.top + chartH * (1 - ratio);
  };

  // Tracé SVG de la courbe Baseline
  const baselinePath = useMemo(() => {
    if (points.length === 0) return "";
    return points.reduce((acc, p, i) => {
      const x = getX(i);
      const y = getY(p.baselineBalance);
      return i === 0 ? `M ${x.toFixed(1)},${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)},${y.toFixed(1)}`;
    }, "");
  }, [points, minVal, maxVal]);

  // Tracé SVG de l'aire Baseline
  const baselineAreaPath = useMemo(() => {
    if (points.length === 0) return "";
    const firstX = getX(0);
    const lastX = getX(points.length - 1);
    const baselineFloorY = Math.min(height - padding.bottom, Math.max(padding.top, zeroY));
    return `${baselinePath} L ${lastX.toFixed(1)},${baselineFloorY.toFixed(1)} L ${firstX.toFixed(1)},${baselineFloorY.toFixed(1)} Z`;
  }, [baselinePath, points, zeroY, height, padding.bottom, padding.top]);

  // Tracé SVG de la courbe Simulé
  const simulatedPath = useMemo(() => {
    if (!isSimulating || points.length === 0) return "";
    return points.reduce((acc, p, i) => {
      const x = getX(i);
      const y = getY(p.simulatedBalance);
      return i === 0 ? `M ${x.toFixed(1)},${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)},${y.toFixed(1)}`;
    }, "");
  }, [points, isSimulating, minVal, maxVal]);

  const activePoint = hoveredIndex !== null && points[hoveredIndex] ? points[hoveredIndex] : points[0];

  return (
    <div
      className="cauri-radar-chart-container"
      style={{
        background: "linear-gradient(180deg, #0f172a 0%, #090d16 100%)",
        borderRadius: "18px",
        padding: "20px",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        color: "#f8fafc",
        position: "relative",
      }}
    >
      {/* En-tête du graphique avec légendes */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "#94a3b8",
                fontWeight: 700,
              }}
            >
              Trajectoire Prédictive à 30 Jours
            </span>
            {isSimulating && (
              <span
                style={{
                  background: "rgba(56, 189, 248, 0.18)",
                  color: "#38bdf8",
                  fontSize: "11px",
                  fontWeight: 800,
                  padding: "2px 8px",
                  borderRadius: "999px",
                  border: "1px solid rgba(56, 189, 248, 0.35)",
                }}
              >
                Scénario What-If Actif
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 800,
              fontFamily: "var(--font-display, sans-serif)",
              color: "#ffffff",
              marginTop: "4px",
            }}
          >
            {activePoint ? (
              <>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>
                  {formatTreasuryMoney(
                    isSimulating ? activePoint.simulatedBalance : activePoint.baselineBalance,
                    currency
                  )}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "#94a3b8",
                    marginLeft: "8px",
                  }}
                >
                  ({activePoint.dayLabel} - {activePoint.date})
                </span>
              </>
            ) : (
              "Calcul de projection..."
            )}
          </div>
        </div>

        {/* Légende */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "12px",
                height: "3px",
                backgroundColor: healthStatus === "danger" ? "#ef4444" : "#22c55e",
                borderRadius: "2px",
              }}
            />
            <span style={{ color: "#cbd5e1" }}>Réel / Enregistré</span>
          </div>
          {isSimulating && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  width: "12px",
                  height: "3px",
                  backgroundColor: "#38bdf8",
                  borderTop: "2px dashed #38bdf8",
                  borderRadius: "2px",
                }}
              />
              <span style={{ color: "#38bdf8", fontWeight: 700 }}>Simulé (What-If)</span>
            </div>
          )}
          {minVal < 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  width: "12px",
                  height: "2px",
                  backgroundColor: "#ef4444",
                  borderRadius: "2px",
                }}
              />
              <span style={{ color: "#f87171" }}>Seuil Rupture (0 FCFA)</span>
            </div>
          )}
        </div>
      </div>

      {/* Rendu SVG Responsive */}
      <div style={{ width: "100%", overflowX: "auto" }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: "100%", height: "auto", display: "block" }}
          role="img"
          aria-label="Graphique prédictif de trésorerie sur 30 jours"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={healthStatus === "danger" ? "#ef4444" : "#22c55e"}
                stopOpacity="0.32"
              />
              <stop
                offset="100%"
                stopColor={healthStatus === "danger" ? "#ef4444" : "#22c55e"}
                stopOpacity="0.0"
              />
            </linearGradient>

            <linearGradient id={simGradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grille horizontale & Ticks Y */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const val = minVal + (maxVal - minVal) * pct;
            const y = getY(val);
            return (
              <g key={`y-${idx}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.07)"
                  strokeDasharray={pct === 0 ? "none" : "3,3"}
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="10"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {formatTreasuryMoney(val, currency).replace(" " + (currency === "XOF" ? "FCFA" : currency), "")}
                </text>
              </g>
            );
          })}

          {/* Ligne Seuil Zéro (Alerte Rupture) si visible */}
          {minVal < 0 && (
            <g>
              <line
                x1={padding.left}
                y1={zeroY}
                x2={width - padding.right}
                y2={zeroY}
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeDasharray="4,4"
              />
              <text
                x={width - padding.right}
                y={zeroY - 6}
                fill="#ef4444"
                fontSize="10"
                fontWeight="700"
                textAnchor="end"
              >
                Seuil 0 {currency === "XOF" ? "FCFA" : currency}
              </text>
            </g>
          )}

          {/* Aire sous la courbe Baseline */}
          <path d={baselineAreaPath} fill={`url(#${gradientId})`} />

          {/* Ligne Baseline */}
          <path
            d={baselinePath}
            fill="none"
            stroke={healthStatus === "danger" ? "#ef4444" : "#22c55e"}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Ligne Simulé (What-If) */}
          {isSimulating && simulatedPath && (
            <path
              d={simulatedPath}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeDasharray="5,4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Marqueur de rupture baseline si présent */}
          {ruptureDayIndex !== null && points[ruptureDayIndex] && (
            <g>
              <circle
                cx={getX(ruptureDayIndex)}
                cy={getY(points[ruptureDayIndex].baselineBalance)}
                r="6"
                fill="#ef4444"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <text
                x={getX(ruptureDayIndex)}
                y={getY(points[ruptureDayIndex].baselineBalance) - 12}
                fill="#fca5a5"
                fontSize="11"
                fontWeight="800"
                textAnchor="middle"
              >
                Rupture J+{ruptureDayIndex}
              </text>
            </g>
          )}

          {/* Ticks X (J+0, J+7, J+14, J+21, J+30) */}
          {[0, 7, 14, 21, 30].map((d) => {
            const pt = points[d];
            if (!pt) return null;
            const x = getX(d);
            const y = height - padding.bottom + 18;
            return (
              <g key={`x-${d}`}>
                <line
                  x1={x}
                  y1={height - padding.bottom}
                  x2={x}
                  y2={height - padding.bottom + 5}
                  stroke="rgba(255, 255, 255, 0.15)"
                />
                <text
                  x={x}
                  y={y}
                  fill="#94a3b8"
                  fontSize="11"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  {d === 0 ? "Auj." : `J+${d}`}
                </text>
              </g>
            );
          })}

          {/* Ligne de survol interactive */}
          {hoveredIndex !== null && (
            <g>
              <line
                x1={getX(hoveredIndex)}
                y1={padding.top}
                x2={getX(hoveredIndex)}
                y2={height - padding.bottom}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="3,3"
              />
              <circle
                cx={getX(hoveredIndex)}
                cy={getY(points[hoveredIndex].baselineBalance)}
                r="5"
                fill="#22c55e"
                stroke="#ffffff"
                strokeWidth="2"
              />
              {isSimulating && (
                <circle
                  cx={getX(hoveredIndex)}
                  cy={getY(points[hoveredIndex].simulatedBalance)}
                  r="5"
                  fill="#38bdf8"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              )}
            </g>
          )}

          {/* Zones tactiles et de survol transparentes */}
          {points.map((p, i) => (
            <rect
              key={`zone-${i}`}
              x={getX(i) - chartW / points.length / 2}
              y={padding.top}
              width={chartW / points.length}
              height={chartH}
              fill="transparent"
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHoveredIndex(i)}
              onTouchStart={() => setHoveredIndex(i)}
            />
          ))}
        </svg>
      </div>

      {/* Résumé contextuel de l'échéance sélectionnée */}
      {activePoint && (
        <div
          style={{
            marginTop: "12px",
            padding: "10px 14px",
            borderRadius: "10px",
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
            fontSize: "12px",
            color: "#94a3b8",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Info size={14} color="#38bdf8" />
            <span>
              Flux attendus le <strong>{activePoint.dayLabel}</strong> ({activePoint.date}) :
            </span>
          </div>

          <div style={{ display: "flex", gap: "16px", fontVariantNumeric: "tabular-nums" }}>
            <span>
              Entrées :{" "}
              <strong style={{ color: "#22c55e" }}>
                +{formatTreasuryMoney(
                  isSimulating ? activePoint.simulatedInflow : activePoint.baselineInflow,
                  currency
                )}
              </strong>
            </span>
            <span>
              Sorties :{" "}
              <strong style={{ color: "#f87171" }}>
                -{formatTreasuryMoney(
                  isSimulating ? activePoint.simulatedOutflow : activePoint.baselineOutflow,
                  currency
                )}
              </strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
