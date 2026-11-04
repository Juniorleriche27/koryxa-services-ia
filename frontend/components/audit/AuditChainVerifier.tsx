"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  RotateCw,
  Hash,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ExternalLink,
} from "lucide-react";
import {
  AuditChainIntegrityReport,
  verifyAuditChainIntegrity,
  RawAuditEvent,
} from "@/lib/audit/audit-hash-chain";

interface AuditChainVerifierProps {
  events: RawAuditEvent[];
  onScanComplete?: (report: AuditChainIntegrityReport) => void;
}

export function AuditChainVerifier({ events, onScanComplete }: AuditChainVerifierProps) {
  const [scanning, setScanning] = useState(false);
  const [report, setReport] = useState<AuditChainIntegrityReport>(() =>
    verifyAuditChainIntegrity(events)
  );

  const handleRunVerification = async () => {
    setScanning(true);
    // Délai ergonomique court pour que l'utilisateur perçoive le scan cryptographique
    await new Promise((resolve) => setTimeout(resolve, 350));
    const rep = verifyAuditChainIntegrity(events);
    setReport(rep);
    setScanning(false);
    if (onScanComplete) {
      onScanComplete(rep);
    }
  };

  const truncatedHash = (hash: string) => {
    if (!hash || hash.length < 16) return hash;
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  return (
    <div
      className="cauri-audit-verifier"
      style={{
        background: "linear-gradient(180deg, #0f172a 0%, #090d16 100%)",
        borderRadius: "16px",
        padding: "18px 22px",
        border: report.isValid
          ? "1px solid rgba(34, 197, 94, 0.25)"
          : "1px solid rgba(239, 68, 68, 0.4)",
        color: "#ffffff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
      }}
    >
      {/* Statut d'intégrité */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            backgroundColor: report.isValid ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
            color: report.isValid ? "#22c55e" : "#ef4444",
            border: report.isValid ? "1px solid rgba(34, 197, 94, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          {report.isValid ? <ShieldCheck size={22} /> : <AlertTriangle size={22} />}
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <strong style={{ fontSize: "16px", color: "#f8fafc" }}>
              {report.isValid
                ? "Registre Immuable & Chaîne Cryptographique Certifiée"
                : "Alerte : Rupture de Continuité Cryptographique Détectée !"}
            </strong>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                padding: "2px 8px",
                borderRadius: "999px",
                backgroundColor: report.isValid ? "rgba(34, 197, 94, 0.18)" : "rgba(239, 68, 68, 0.18)",
                color: report.isValid ? "#22c55e" : "#ef4444",
                border: report.isValid ? "1px solid rgba(34, 197, 94, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
              }}
            >
              {report.isValid ? "SHA-256 Valide" : "Altération Détectée"}
            </span>
          </div>

          <div
            style={{
              fontSize: "12px",
              color: "#94a3b8",
              marginTop: "4px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              flexWrap: "wrap",
            }}
          >
            <span>
              <strong>{report.totalEvents}</strong> écritures auditées
            </span>
            <span>•</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontFamily: "monospace" }}>
              <Lock size={12} color="#38bdf8" />
              <span>Head : {truncatedHash(report.chainHeadHash)}</span>
            </span>
            <span>•</span>
            <span>Vérifié à {new Date(report.verifiedAt).toLocaleTimeString("fr-FR")}</span>
          </div>
        </div>
      </div>

      {/* Action de vérification */}
      <div>
        <button
          type="button"
          onClick={handleRunVerification}
          disabled={scanning}
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            color: "#f8fafc",
            borderRadius: "10px",
            padding: "8px 16px",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            transition: "0.2s ease",
            minHeight: "44px",
          }}
          title="Recalculer et certifier l'intégrité de la chaîne cryptographique"
        >
          <RotateCw size={14} className={scanning ? "animate-spin" : ""} />
          <span>{scanning ? "Vérification..." : "Vérifier la chaîne"}</span>
        </button>
      </div>
    </div>
  );
}
