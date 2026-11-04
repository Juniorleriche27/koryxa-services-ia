"use client";

import React, { useState } from "react";
import {
  ReceivableItem,
  calculateDaysOverdue,
  generateWhatsAppReminderMessage,
  formatTreasuryMoney,
  parseMoney,
} from "@/lib/radar/cashflow-projection";
import {
  Send,
  Copy,
  Check,
  ExternalLink,
  Clock,
  ShieldCheck,
  FileText,
  User,
  Phone,
  AlertTriangle,
} from "lucide-react";

interface ReceivablesRecoveryRadarProps {
  receivables: ReceivableItem[];
  currency?: string;
  organizationName?: string;
}

export function ReceivablesRecoveryRadar({
  receivables,
  currency = "XOF",
  organizationName = "CAURI",
}: ReceivablesRecoveryRadarProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtre les factures échues ou avec solde restant
  const overdueList = receivables
    .map((sale) => {
      const tot = parseMoney(sale.total_amount);
      const paid = parseMoney(sale.paid_amount);
      const remaining = Math.max(0, tot - paid);
      const days = calculateDaysOverdue(sale.due_date);
      return {
        ...sale,
        remaining,
        daysOverdue: days,
      };
    })
    .filter((s) => s.remaining > 0 && s.daysOverdue > 0)
    .sort((a, b) => b.daysOverdue - a.daysOverdue || b.remaining - a.remaining);

  const handleCopyMessage = async (sale: (typeof overdueList)[0]) => {
    const text = generateWhatsAppReminderMessage({
      clientName: sale.client_name,
      reference: sale.reference,
      amountRemaining: sale.remaining,
      currency: sale.currency || currency,
      publicToken: sale.public_token,
      daysOverdue: sale.daysOverdue,
      organizationName,
    });

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopiedId(sale.id);
        setTimeout(() => setCopiedId(null), 2500);
      }
    } catch {
      // fallback
    }
  };

  const getUrgencyBadge = (days: number) => {
    if (days >= 30) {
      return {
        label: `Critique (+${days}j)`,
        bg: "rgba(239, 68, 68, 0.15)",
        color: "#ef4444",
        border: "1px solid rgba(239, 68, 68, 0.3)",
      };
    }
    if (days >= 15) {
      return {
        label: `Moyen (+${days}j)`,
        bg: "rgba(245, 158, 11, 0.15)",
        color: "#f59e0b",
        border: "1px solid rgba(245, 158, 11, 0.3)",
      };
    }
    return {
      label: `Récent (+${days}j)`,
      bg: "rgba(56, 189, 248, 0.15)",
      color: "#38bdf8",
      border: "1px solid rgba(56, 189, 248, 0.3)",
    };
  };

  const cleanPhone = (phone?: string | null) => {
    if (!phone) return "";
    return phone.replace(/[^0-9]/g, "");
  };

  return (
    <div
      className="cauri-receivables-radar"
      style={{
        background: "#ffffff",
        borderRadius: "18px",
        padding: "20px",
        border: "1px solid #dceee4",
        boxShadow: "0 12px 34px rgba(39, 94, 65, 0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "16px",
          borderBottom: "1px solid #eef5f1",
          paddingBottom: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              backgroundColor: "#e8f8f0",
              color: "#00a86b",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Clock size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#111827" }}>
              Radar de Recouvrement 1-Clic
            </h3>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              Factures impayées échues & relances instantanées avec lien vers document vivant
            </span>
          </div>
        </div>

        {overdueList.length > 0 && (
          <span
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              color: "#ef4444",
              padding: "4px 10px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: 800,
            }}
          >
            {overdueList.length} facture{overdueList.length > 1 ? "s" : ""} en retard
          </span>
        )}
      </div>

      {overdueList.length === 0 ? (
        <div
          style={{
            padding: "32px 20px",
            textAlign: "center",
            backgroundColor: "#f9fcfa",
            borderRadius: "14px",
            border: "1px dashed #d1e7dc",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              backgroundColor: "#e8f8f0",
              color: "#00a86b",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 12px",
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <strong style={{ display: "block", fontSize: "15px", color: "#1e293b", marginBottom: "4px" }}>
            Aucune créance en retard critique
          </strong>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
            Toutes les factures émises sont soit réglées, soit dans leur délai contractuel normal.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {overdueList.map((sale) => {
            const urgency = getUrgencyBadge(sale.daysOverdue);
            const phoneDigits = cleanPhone(sale.client_phone);
            const msg = generateWhatsAppReminderMessage({
              clientName: sale.client_name,
              reference: sale.reference,
              amountRemaining: sale.remaining,
              currency: sale.currency || currency,
              publicToken: sale.public_token,
              daysOverdue: sale.daysOverdue,
              organizationName,
            });
            const waUrl = phoneDigits
              ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(msg)}`
              : `https://wa.me/?text=${encodeURIComponent(msg)}`;

            return (
              <article
                key={sale.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "14px",
                  padding: "14px",
                  borderRadius: "14px",
                  backgroundColor: "#fbfdfc",
                  border: "1px solid #e5f0ea",
                }}
              >
                {/* Colonne d'infos client & facture */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", minWidth: "220px", flex: 1 }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      backgroundColor: "#f1f7f4",
                      color: "#334155",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <FileText size={18} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <strong style={{ fontSize: "14px", color: "#0f172a" }}>
                        {sale.client_name || "Client anonyme"}
                      </strong>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "999px",
                          backgroundColor: urgency.bg,
                          color: urgency.color,
                          border: urgency.border,
                        }}
                      >
                        {urgency.label}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px", fontSize: "12px", color: "#64748b" }}>
                      <span>Réf : {sale.reference}</span>
                      {sale.due_date && <span>Échéance : {sale.due_date}</span>}
                    </div>
                  </div>
                </div>

                {/* Montant restant dû */}
                <div style={{ textAlign: "right", minWidth: "130px" }}>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: 800,
                      color: "#ef4444",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatTreasuryMoney(sale.remaining, sale.currency || currency)}
                  </div>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>Solde impayé</span>
                </div>

                {/* Boutons d'actions 1-Clic */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {/* Bouton Relance WhatsApp */}
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      backgroundColor: "#25D366",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "10px",
                      padding: "8px 12px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      textDecoration: "none",
                      transition: "0.2s ease",
                      minHeight: "40px",
                    }}
                    title="Envoyer une relance WhatsApp personnalisée"
                  >
                    <Send size={14} />
                    <span>WhatsApp</span>
                  </a>

                  {/* Bouton Copier le message */}
                  <button
                    type="button"
                    onClick={() => void handleCopyMessage(sale)}
                    style={{
                      backgroundColor: copiedId === sale.id ? "#e8f8f0" : "#ffffff",
                      color: copiedId === sale.id ? "#00a86b" : "#475569",
                      border: "1px solid #d1e7dc",
                      borderRadius: "10px",
                      padding: "8px 12px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "0.2s ease",
                      minHeight: "40px",
                    }}
                    title="Copier le message de relance"
                  >
                    {copiedId === sale.id ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedId === sale.id ? "Copié !" : "Copier"}</span>
                  </button>

                  {/* Bouton Voir le Document Vivant */}
                  {sale.public_token && (
                    <a
                      href={`/d/${sale.public_token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        backgroundColor: "#f8fafc",
                        color: "#0284c7",
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        padding: "8px 10px",
                        fontSize: "12px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        textDecoration: "none",
                        minHeight: "40px",
                      }}
                      title="Ouvrir le document vivant public"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
