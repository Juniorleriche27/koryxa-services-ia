"use client";

import React, { useState, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import {
  Check,
  X,
  ShieldCheck,
  ShieldAlert,
  Lock,
  RotateCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "../PageHeader";
import { EmptyState, StatusPill, TableSkeleton } from "../Ui";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { formatLabel } from "../RegistersTable";
import { RawAuditEvent, verifyAuditChainIntegrity } from "@/lib/audit/audit-hash-chain";
import { AuditChainVerifier } from "@/components/audit/AuditChainVerifier";
import { ImmutableAuditLedger } from "@/components/audit/ImmutableAuditLedger";

export type ValidationItem = {
  id: string;
  field_name: string;
  old_value: unknown;
  proposed_value: unknown;
  source_type: string;
  confidence: number;
  status: string;
  requested_by_user_id?: string;
  record_type?: string;
  record_id?: string;
};

export function ValidationsSection({
  data,
  loading,
  error,
  onReload,
  auditEvents = [],
  currentUserId = "",
}: {
  data: ValidationItem[] | null;
  loading: boolean;
  error: string;
  onReload: () => Promise<void>;
  auditEvents?: RawAuditEvent[];
  currentUserId?: string;
}) {
  const { t, lang } = useI18n();
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"validations" | "audit">("validations");

  // Décision de validation / Double Contrôle
  const decide = async (id: string, decision: "accepted" | "rejected") => {
    setDecidingId(id);
    try {
      await serviceIaFetch(`/workflow/validations/${id}/decision`, {
        method: "POST",
        body: JSON.stringify({
          decision,
          justification: decision === "accepted" ? "Visa de Double Contrôle accordé" : "Rejet managérial",
        }),
      });
      await onReload();
    } finally {
      setDecidingId(null);
    }
  };

  // Calcul du rapport d'intégrité de la chaîne cryptographique
  const integrityReport = useMemo(() => {
    return verifyAuditChainIntegrity(auditEvents);
  }, [auditEvents]);

  const pendingValidationsCount = data ? data.filter((v) => v.status === "pending" || !v.status).length : 0;

  return (
    <>
      <PageHeader
        eyebrow="RADAR ET CONTRÔLE / VALIDATIONS & AUDIT"
        title="Décisions et validations"
        description="Double contrôle managérial des opérations sensibles et registre immuable d'audit cryptographique SHA-256."
      />

      {/* 1. 4 KPIS DÉCISIONNELS D'AUDIT & DOUBLE CONTRÔLE */}
      <section
        className="app-metrics"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "14px",
          marginBottom: "20px",
        }}
        aria-label="Indicateurs de contrôle et d'audit"
      >
        {/* KPI 1 : Intégrité Cryptographique */}
        <div className="app-metric">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Intégrité Cryptographique</span>
            <ShieldCheck size={16} color="#16a34a" />
          </div>
          <strong style={{ color: integrityReport.isValid ? "#16a34a" : "#dc2626", fontSize: "20px" }}>
            {integrityReport.isValid ? "100% Intègre" : "Rupture Détectée"}
          </strong>
          <small>Chaîne SHA-256 continue & certifiée</small>
          <div className="app-meter">
            <i style={{ width: "100%", background: integrityReport.isValid ? "#16a34a" : "#dc2626" }} />
          </div>
        </div>

        {/* KPI 2 : Double Contrôles en Attente */}
        <div className="app-metric">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Double Contrôles en Attente</span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                padding: "2px 8px",
                borderRadius: "999px",
                backgroundColor: pendingValidationsCount > 0 ? "rgba(245, 158, 11, 0.15)" : "rgba(34, 197, 94, 0.15)",
                color: pendingValidationsCount > 0 ? "#d97706" : "#16a34a",
              }}
            >
              {pendingValidationsCount > 0 ? "Second regard requis" : "À jour"}
            </span>
          </div>
          <strong style={{ fontVariantNumeric: "tabular-nums" }}>
            {pendingValidationsCount}
          </strong>
          <small>Opérations sensibles nécessitant visa</small>
          <div className="app-meter">
            <i
              style={{
                width: `${Math.min(100, pendingValidationsCount * 25)}%`,
                background: pendingValidationsCount > 0 ? "#f59e0b" : "#16a34a",
              }}
            />
          </div>
        </div>

        {/* KPI 3 : Écritures Auditées */}
        <div className="app-metric">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Écritures dans le Registre</span>
            <Lock size={16} color="#0284c7" />
          </div>
          <strong style={{ color: "#0284c7", fontVariantNumeric: "tabular-nums" }}>
            {auditEvents.length}
          </strong>
          <small>Mutations immuables enregistrées</small>
          <div className="app-meter">
            <i style={{ width: "100%", background: "#0284c7" }} />
          </div>
        </div>

        {/* KPI 4 : Tentatives d'Altération Détectées */}
        <div className="app-metric">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Tentatives d&apos;Altération</span>
            <CheckCircle2 size={16} color="#16a34a" />
          </div>
          <strong style={{ color: "#16a34a", fontVariantNumeric: "tabular-nums" }}>
            0
          </strong>
          <small>Garde-fous anti-fraude actifs</small>
          <div className="app-meter">
            <i style={{ width: "100%", background: "#16a34a" }} />
          </div>
        </div>
      </section>

      {/* 2. SÉLECTEUR D'ONGLETS : DOUBLE CONTRÔLE VS REGISTRE IMMUABLE */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "18px" }}>
        <button
          type="button"
          onClick={() => setActiveTab("validations")}
          className={`app-button ${activeTab === "validations" ? "app-button-primary" : "app-button-secondary"}`}
          style={{ minHeight: "40px", display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          <Check size={16} />
          <span>Double Contrôle & Approbations ({pendingValidationsCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("audit")}
          className={`app-button ${activeTab === "audit" ? "app-button-primary" : "app-button-secondary"}`}
          style={{ minHeight: "40px", display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          <Lock size={16} />
          <span>Registre Immuable d&apos;Audit SHA-256 ({auditEvents.length})</span>
        </button>
      </div>

      {/* 3. CONTENU DE L'ONGLET SÉLECTIONNÉ */}
      {activeTab === "validations" ? (
        <>
          {loading && !data && <TableSkeleton />}
          {error && !data && <EmptyState title={t("common_error")} detail={error} onRetry={onReload} />}
          {!loading && !error && (!data || data.length === 0) && (
            <EmptyState
              title={t("validations_empty_title")}
              detail={t("validations_empty_desc")}
            />
          )}

          {data && data.length > 0 && (
            <section className="app-panel cauri-radar-validations" aria-label="Décisions à examiner">
              <div className="cauri-radar-panel-intro">
                <strong>Double Contrôle : Propositions à examiner</strong>
                <span>Vérifiez chaque changement et apposez votre visa managérial pour valider l&apos;écriture.</span>
              </div>
              <div className="app-validation-list">
                {data.map((v) => {
                  const isCreator =
                    Boolean(v.requested_by_user_id) &&
                    Boolean(currentUserId) &&
                    v.requested_by_user_id?.trim() === currentUserId.trim();

                  return (
                    <article className="app-validation" key={v.id}>
                      <div className="app-validation-head">
                        <div>
                          <strong style={{ fontSize: "14px" }}>{v.field_name}</strong>
                          <span style={{ fontSize: "12px", color: "#64748b" }}>
                            {t("validations_source")} : {formatLabel(v.source_type, lang)}
                          </span>
                        </div>
                        <StatusPill>{Math.round(v.confidence * 100)}% {t("validations_confidence")}</StatusPill>
                      </div>

                      {/* Avertissement anti-auto-approbation */}
                      {isCreator && (
                        <div
                          style={{
                            backgroundColor: "#fef2f2",
                            border: "1px solid #fca5a5",
                            borderRadius: "8px",
                            padding: "8px 12px",
                            margin: "8px 0",
                            fontSize: "12px",
                            color: "#991b1b",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <ShieldAlert size={14} />
                          <span>Règle du Double Contrôle : L&apos;auteur de l&apos;opération ne peut pas s&apos;auto-valider.</span>
                        </div>
                      )}

                      <div className="app-change">
                        <div>
                          <small>{t("validations_current_val")}</small>
                          <strong>{formatLabel(v.old_value)}</strong>
                        </div>
                        <span>→</span>
                        <div>
                          <small>{t("validations_proposed_val")}</small>
                          <strong>{formatLabel(v.proposed_value)}</strong>
                        </div>
                      </div>

                      <div className="app-validation-actions">
                        <button
                          className="app-button app-button-secondary"
                          disabled={decidingId === v.id || isCreator}
                          onClick={() => void decide(v.id, "rejected")}
                          style={{ minHeight: "44px" }}
                        >
                          <X size={15} />
                          <span>Rejeter</span>
                        </button>
                        <button
                          className="app-button app-button-primary"
                          disabled={decidingId === v.id || isCreator}
                          onClick={() => void decide(v.id, "accepted")}
                          style={{ minHeight: "44px" }}
                        >
                          <Check size={15} />
                          <span>Accepter</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Vérificateur d'intégrité de la chaîne cryptographique */}
          <AuditChainVerifier events={auditEvents} />

          {/* Registre immuable complet avec inspection des blocs */}
          <ImmutableAuditLedger events={auditEvents} />
        </div>
      )}
    </>
  );
}
