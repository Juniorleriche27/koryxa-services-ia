"use client";

import React from "react";
import { CreditTier, getTierConfig } from "@/lib/credit/client-scoring";
import { ShieldCheck, AlertTriangle, AlertOctagon } from "lucide-react";

interface ClientSolvencyBadgeProps {
  score: number;
  tier?: CreditTier;
  showScore?: boolean;
  onClick?: () => void;
  size?: "sm" | "md";
}

export function ClientSolvencyBadge({
  score,
  tier: forcedTier,
  showScore = true,
  onClick,
  size = "sm",
}: ClientSolvencyBadgeProps) {
  const config = getTierConfig(score);
  const tier = forcedTier || config.tier;

  const isSmall = size === "sm";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: isSmall ? "2px 7px" : "4px 10px",
        borderRadius: "999px",
        backgroundColor: config.tierBg,
        color: config.tierColor,
        border: `1px solid ${config.tierBorder}`,
        fontSize: isSmall ? "10px" : "12px",
        fontWeight: 800,
        fontFamily: "var(--font-sans, sans-serif)",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.15s ease",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
      title={`Solvabilité Cauri : ${config.tierLabel} (${score}/100). Cliquez pour voir la fiche d'analyse.`}
      aria-label={`Score de solvabilité ${score} sur 100, Rang ${tier}`}
    >
      {tier === "A+" || tier === "A" ? (
        <ShieldCheck size={isSmall ? 11 : 14} />
      ) : tier === "B" || tier === "C" ? (
        <AlertTriangle size={isSmall ? 11 : 14} />
      ) : (
        <AlertOctagon size={isSmall ? 11 : 14} />
      )}
      <span>{tier}</span>
      {showScore && (
        <span
          style={{
            opacity: 0.8,
            fontVariantNumeric: "tabular-nums",
            fontWeight: 700,
          }}
        >
          {score}
        </span>
      )}
    </button>
  );
}
