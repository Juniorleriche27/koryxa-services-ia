"use client";

import React, { useState } from "react";
import { Dialog } from "../app/Dialog";
import { ClientSolvencyMetrics, getTierConfig } from "@/lib/credit/client-scoring";
import { formatTreasuryMoney } from "@/lib/radar/cashflow-projection";
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Phone,
  Mail,
  Send,
  FileText,
  DollarSign,
  TrendingUp,
  Percent,
} from "lucide-react";

interface ClientSolvencyModalProps {
  open: boolean;
  onClose: () => void;
  client: ClientSolvencyMetrics | null;
  onOpenReminder?: (sale: ClientSolvencyMetrics["sales"][0]) => void;
  currency?: string;
}

export function ClientSolvencyModal({
  open,
  onClose,
  client,
  onOpenReminder,
  currency = "XOF",
}: ClientSolvencyModalProps) {
  if (!open || !client) return null;

  const config = getTierConfig(client.solvencyScore);
  const unpaidSales = client.sales.filter((s) => {
    const tot = Number(s.total_amount || 0);
    const paid = Number(s.paid_amount || 0);
    return tot - paid > 0;
  });

  return (
    <Dialog
      open
      title={`Fiche de Solvabilité Client : ${client.clientName}`}
      description="Analyse du comportement de paiement, score de crédit et recommandations commerciales Cauri IA."
      onClose={onClose}
    >
      <div className="kx-client-solvency-body" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* En-tête Client & Score Principal */}
        <div
          style={{
            background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
            borderRadius: "16px",
            padding: "20px",
            color: "#ffffff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 800 }}>{client.clientName}</h3>
              <span
                style={{
                  backgroundColor: config.tierBg,
                  color: config.tierColor,
                  border: `1px solid ${config.tierBorder}`,
                  fontSize: "12px",
                  fontWeight: 800,
                  padding: "3px 10px",
                  borderRadius: "999px",
                }}
              >
                Rang {config.tier} - {config.tierLabel}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "8px", fontSize: "13px", color: "#94a3b8" }}>
              {client.clientPhone && (
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <Phone size={14} />
                  <span>{client.clientPhone}</span>
                </div>
              )}
              {client.clientEmail && (
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <Mail size={14} />
                  <span>{client.clientEmail}</span>
                </div>
              )}
              <span>{client.totalSalesCount} facture{client.totalSalesCount > 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Jauge Score 0 à 100 */}
          <div
            style={{
              textAlign: "center",
              background: "rgba(255, 255, 255, 0.05)",
              padding: "12px 20px",
              borderRadius: "14px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              minWidth: "120px",
            }}
          >
            <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#94a3b8", fontWeight: 700, display: "block" }}>
              Score Cauri
            </span>
            <div
              style={{
                fontSize: "32px",
                fontWeight: 900,
                color: config.tierColor,
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1.1,
              }}
            >
              {client.solvencyScore}
              <span style={{ fontSize: "16px", color: "#64748b" }}>/100</span>
            </div>
          </div>
        </div>

        {/* 4 Métriques Financières */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "12px",
          }}
        >
          <div style={{ background: "#f8fcfa", padding: "14px", borderRadius: "12px", border: "1px solid #e4f0e9" }}>
            <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Total Facturé</span>
            <strong style={{ fontSize: "15px", color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>
              {formatTreasuryMoney(client.totalInvoiced, currency)}
            </strong>
          </div>

          <div style={{ background: "#f8fcfa", padding: "14px", borderRadius: "12px", border: "1px solid #e4f0e9" }}>
            <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Total Encaissé</span>
            <strong style={{ fontSize: "15px", color: "#16a34a", fontVariantNumeric: "tabular-nums" }}>
              {formatTreasuryMoney(client.totalPaid, currency)}
            </strong>
          </div>

          <div style={{ background: "#f8fcfa", padding: "14px", borderRadius: "12px", border: "1px solid #e4f0e9" }}>
            <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Solde Impayé</span>
            <strong
              style={{
                fontSize: "15px",
                color: client.totalOutstanding > 0 ? "#ef4444" : "#00a86b",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatTreasuryMoney(client.totalOutstanding, currency)}
            </strong>
          </div>

          <div style={{ background: "#f8fcfa", padding: "14px", borderRadius: "12px", border: "1px solid #e4f0e9" }}>
            <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Retard Moyen</span>
            <strong style={{ fontSize: "15px", color: client.avgOverdueDays > 15 ? "#ef4444" : "#334155" }}>
              {client.avgOverdueDays} jours
            </strong>
          </div>
        </div>

        {/* Directive Commerciale IA & Plafond Conseillé */}
        <div
          style={{
            background: config.tierBg,
            border: `1px solid ${config.tierBorder}`,
            borderRadius: "14px",
            padding: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            {config.tier === "A+" || config.tier === "A" ? (
              <ShieldCheck size={18} color={config.tierColor} />
            ) : (
              <AlertTriangle size={18} color={config.tierColor} />
            )}
            <strong style={{ fontSize: "14px", color: config.tierColor }}>
              Politique de Crédit & Arbitrage Commercial Conseillé :
            </strong>
          </div>
          <p style={{ margin: "4px 0 10px 0", fontSize: "13px", color: "#334155", lineHeight: 1.5 }}>
            {config.creditPolicy}
          </p>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#475569",
              paddingTop: "8px",
              borderTop: "1px dashed rgba(0,0,0,0.08)",
            }}
          >
            Plafond d&apos;encours maximal suggéré :{" "}
            <span style={{ color: config.tierColor, fontVariantNumeric: "tabular-nums" }}>
              {formatTreasuryMoney(client.maxRecommendedCredit, currency)}
            </span>
          </div>
        </div>

        {/* Factures en attente de règlement avec action de relance */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <strong style={{ fontSize: "14px", color: "#111827" }}>
              Factures à régulariser ({unpaidSales.length})
            </strong>
          </div>

          {unpaidSales.length === 0 ? (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                backgroundColor: "#f9fcfa",
                borderRadius: "12px",
                border: "1px dashed #d1e7dc",
                color: "#16a34a",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              Ce client n&apos;a aucun impayé en cours. Situation à jour.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "200px", overflowY: "auto" }}>
              {unpaidSales.map((sale) => {
                const tot = Number(sale.total_amount || 0);
                const paid = Number(sale.paid_amount || 0);
                const remaining = Math.max(0, tot - paid);

                return (
                  <div
                    key={sale.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      backgroundColor: "#f8fcfa",
                      border: "1px solid #e4f0e9",
                      fontSize: "13px",
                    }}
                  >
                    <div>
                      <strong style={{ color: "#0f172a" }}>{sale.reference}</strong>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>
                        Émise le {sale.sale_date} {sale.due_date ? `• Échéance : ${sale.due_date}` : ""}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontWeight: 800, color: "#ef4444", fontVariantNumeric: "tabular-nums" }}>
                        {formatTreasuryMoney(remaining, sale.currency || currency)}
                      </span>

                      {onOpenReminder && (
                        <button
                          type="button"
                          className="app-button app-button-secondary"
                          onClick={() => onOpenReminder(sale)}
                          style={{
                            minHeight: "34px",
                            padding: "6px 12px",
                            fontSize: "12px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <Send size={13} />
                          <span>Relancer</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bouton Fermer */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={onClose}
            style={{ minHeight: "44px" }}
          >
            Fermer
          </button>
        </div>
      </div>
    </Dialog>
  );
}
