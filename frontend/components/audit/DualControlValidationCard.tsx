"use client";

import React, { useState } from "react";
import { ValidationItem } from "../app/sections/ValidationsSection";
import { formatLabel } from "../app/RegistersTable";
import { useI18n } from "@/lib/i18n";
import {
  Check,
  X,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  User,
  ArrowRight,
  Clock,
} from "lucide-react";
import { validateApproverIdentity } from "@/lib/audit/four-eyes-policy";

interface DualControlValidationCardProps {
  item: ValidationItem & {
    requested_by_user_id?: string;
    record_type?: string;
    record_id?: string;
  };
  currentUserId?: string;
  currentUserRole?: string;
  onDecide: (id: string, decision: "accepted" | "rejected", justification?: string) => Promise<void>;
  disabled?: boolean;
}

export function DualControlValidationCard({
  item,
  currentUserId = "",
  currentUserRole = "manager",
  onDecide,
  disabled = false,
}: DualControlValidationCardProps) {
  const { t, lang } = useI18n();
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Évaluation de la règle du Double Contrôle
  const isCreator =
    Boolean(item.requested_by_user_id) &&
    Boolean(currentUserId) &&
    item.requested_by_user_id?.trim() === currentUserId.trim();

  const approverCheck = validateApproverIdentity({
    creatorUserId: item.requested_by_user_id || "",
    approverUserId: currentUserId,
    approverRole: currentUserRole,
  });

  const handleAccept = async () => {
    setSubmitting(true);
    try {
      await onDecide(item.id, "accepted", "Visa managérial accordé via Double Contrôle");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectConfirm = async () => {
    setSubmitting(true);
    try {
      await onDecide(item.id, "rejected", rejectionReason || "Rejet managérial via Double Contrôle");
      setRejecting(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <article
      className="app-validation"
      style={{
        borderRadius: "16px",
        padding: "18px",
        backgroundColor: "#ffffff",
        border: isCreator ? "1px solid #fecaca" : "1px solid #e4f0e9",
        boxShadow: "0 6px 20px rgba(0, 0, 0, 0.03)",
        position: "relative",
      }}
    >
      {/* En-tête de validation */}
      <div className="app-validation-head" style={{ marginBottom: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <strong style={{ fontSize: "15px", color: "#0f172a" }}>
              {item.field_name}
            </strong>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                padding: "2px 8px",
                borderRadius: "999px",
                backgroundColor: "rgba(147, 51, 234, 0.12)",
                color: "#7e22ce",
              }}
            >
              Double Contrôle Requis
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px", fontSize: "12px", color: "#64748b" }}>
            <span>Source : {formatLabel(item.source_type, lang)}</span>
            {item.requested_by_user_id && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <User size={12} />
                <span>Initié par {item.requested_by_user_id}</span>
              </span>
            )}
          </div>
        </div>

        <span
          style={{
            fontSize: "12px",
            fontWeight: 800,
            padding: "4px 10px",
            borderRadius: "999px",
            backgroundColor: "#f0fdf4",
            color: "#16a34a",
            border: "1px solid #bbf7d0",
          }}
        >
          {Math.round(item.confidence * 100)}% de fiabilité
        </span>
      </div>

      {/* Alerte si tentative d'auto-approbation */}
      {isCreator && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fca5a5",
            borderRadius: "10px",
            padding: "10px 14px",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#991b1b",
            fontSize: "12px",
          }}
        >
          <ShieldAlert size={16} flex-shrink={0} />
          <span>
            <strong>Règle Anti-Fraude :</strong> Vous êtes l&apos;auteur de cette modification. Un second regard par un autre gestionnaire est obligatoire pour valider.
          </span>
        </div>
      )}

      {/* Diff : Ancienne valeur vers Nouvelle valeur */}
      <div className="app-change" style={{ marginBottom: "14px" }}>
        <div>
          <small>{t("validations_current_val")}</small>
          <strong style={{ color: "#64748b" }}>{formatLabel(item.old_value)}</strong>
        </div>
        <ArrowRight size={16} color="#00a86b" />
        <div>
          <small>{t("validations_proposed_val")}</small>
          <strong style={{ color: "#00a86b", fontWeight: 800 }}>
            {formatLabel(item.proposed_value)}
          </strong>
        </div>
      </div>

      {/* Motif de rejet si en mode rejet */}
      {rejecting && (
        <div style={{ marginBottom: "12px" }}>
          <label style={{ fontSize: "12px", color: "#475569", fontWeight: 700, display: "block", marginBottom: "4px" }}>
            Motif du rejet (enregistré dans le registre d&apos;audit) :
          </label>
          <input
            type="text"
            placeholder="Ex: Montant non justifié par devis, remise trop importante..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "13px",
              outline: "none",
            }}
          />
        </div>
      )}

      {/* Boutons d'action managériale */}
      <div className="app-validation-actions" style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        {rejecting ? (
          <>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => setRejecting(false)}
              disabled={submitting}
              style={{ minHeight: "44px" }}
            >
              Annuler
            </button>
            <button
              type="button"
              className="app-button"
              onClick={() => void handleRejectConfirm()}
              disabled={submitting || !rejectionReason.trim()}
              style={{
                backgroundColor: "#dc2626",
                color: "#ffffff",
                minHeight: "44px",
                fontWeight: 700,
              }}
            >
              <X size={15} />
              <span>Confirmer le rejet</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="app-button app-button-secondary"
              disabled={disabled || submitting || isCreator}
              onClick={() => setRejecting(true)}
              style={{ minHeight: "44px" }}
              title={isCreator ? "Vous ne pouvez pas rejeter votre propre opération" : "Rejeter cette opération"}
            >
              <X size={15} />
              <span>Rejeter avec motif</span>
            </button>
            <button
              type="button"
              className="app-button app-button-primary"
              disabled={disabled || submitting || isCreator}
              onClick={() => void handleAccept()}
              style={{ minHeight: "44px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              title={isCreator ? "Double Contrôle : Un second regard est requis" : "Apposer votre visa managérial"}
            >
              <Check size={15} />
              <span>Apposer Visa (Accepter)</span>
            </button>
          </>
        )}
      </div>
    </article>
  );
}
