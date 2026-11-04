"use client";

import React, { useState, useMemo } from "react";
import {
  ClientSolvencyMetrics,
  CreditTier,
  aggregateClientSolvency,
  getTierConfig,
} from "@/lib/credit/client-scoring";
import { formatTreasuryMoney } from "@/lib/radar/cashflow-projection";
import { ClientSolvencyBadge } from "./ClientSolvencyBadge";
import { ClientSolvencyModal } from "./ClientSolvencyModal";
import { PaymentReminderDialog } from "../app/PaymentReminderDialog";
import {
  Users,
  Search,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Send,
  Phone,
  Clock,
  ArrowUpDown,
  Filter,
  DollarSign,
} from "lucide-react";
import { SaleItem } from "../app/RegistersTable";

interface ClientSolvencyRadarProps {
  sales: SaleItem[];
  organizationName?: string;
  currency?: string;
}

export function ClientSolvencyRadar({
  sales,
  organizationName = "CAURI",
  currency = "XOF",
}: ClientSolvencyRadarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("all");
  const [activeClientModal, setActiveClientModal] = useState<ClientSolvencyMetrics | null>(null);
  const [activeReminderSale, setActiveReminderSale] = useState<{
    sale: ClientSolvencyMetrics["sales"][0];
    score: number;
    tier: CreditTier;
  } | null>(null);

  // Agrège l'ensemble des ventes en métriques de solvabilité par client
  const clientsPortfolio = useMemo(() => {
    return aggregateClientSolvency(sales as any);
  }, [sales]);

  // Statistiques du portefeuille
  const portfolioStats = useMemo(() => {
    if (clientsPortfolio.length === 0) {
      return {
        avgScore: 50,
        totalOutstanding: 0,
        tierAplusCount: 0,
        riskCount: 0,
      };
    }
    const sumScore = clientsPortfolio.reduce((acc, c) => acc + c.solvencyScore, 0);
    const totalOutstanding = clientsPortfolio.reduce((acc, c) => acc + c.totalOutstanding, 0);
    const tierAplusCount = clientsPortfolio.filter((c) => c.tier === "A+" || c.tier === "A").length;
    const riskCount = clientsPortfolio.filter((c) => c.tier === "C" || c.tier === "D").length;

    return {
      avgScore: Math.round(sumScore / clientsPortfolio.length),
      totalOutstanding,
      tierAplusCount,
      riskCount,
    };
  }, [clientsPortfolio]);

  // Filtrage
  const filteredClients = useMemo(() => {
    return clientsPortfolio.filter((c) => {
      const matchSearch =
        c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.clientPhone && c.clientPhone.includes(searchTerm));

      const matchTier =
        selectedTier === "all" ||
        (selectedTier === "A+" && (c.tier === "A+" || c.tier === "A")) ||
        (selectedTier === "B" && c.tier === "B") ||
        (selectedTier === "risk" && (c.tier === "C" || c.tier === "D"));

      return matchSearch && matchTier;
    });
  }, [clientsPortfolio, searchTerm, selectedTier]);

  const globalTierConfig = getTierConfig(portfolioStats.avgScore);

  return (
    <div
      className="cauri-client-solvency-radar"
      style={{
        background: "#ffffff",
        borderRadius: "18px",
        padding: "22px",
        border: "1px solid #dceee4",
        boxShadow: "0 12px 34px rgba(39, 94, 65, 0.05)",
      }}
    >
      {/* 1. En-tête de section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          marginBottom: "20px",
          borderBottom: "1px solid #eef5f1",
          paddingBottom: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              backgroundColor: "#e8f8f0",
              color: "#00a86b",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Users size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#111827" }}>
              Portefeuille de Solvabilité Client & Risque Crédit
            </h3>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              Évaluation algorithmique du comportement de paiement et arbitrage des facilités de caisse
            </span>
          </div>
        </div>

        <span
          style={{
            fontSize: "12px",
            fontWeight: 800,
            padding: "4px 12px",
            borderRadius: "999px",
            backgroundColor: "#f1f5f9",
            color: "#334155",
          }}
        >
          {clientsPortfolio.length} compte{clientsPortfolio.length > 1 ? "s" : ""} client
        </span>
      </div>

      {/* 2. KPIs du Portefeuille Client */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "14px",
          marginBottom: "20px",
        }}
      >
        {/* KPI 1 : Score Moyen */}
        <div style={{ background: "#f8fcfa", padding: "14px 16px", borderRadius: "14px", border: "1px solid #e4f0e9" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b" }}>
            <span>Solvabilité Moyenne</span>
            <ClientSolvencyBadge score={portfolioStats.avgScore} size="sm" />
          </div>
          <strong
            style={{
              fontSize: "24px",
              fontWeight: 800,
              color: globalTierConfig.tierColor,
              fontVariantNumeric: "tabular-nums",
              display: "block",
              marginTop: "4px",
            }}
          >
            {portfolioStats.avgScore}
            <span style={{ fontSize: "14px", color: "#94a3b8" }}>/100</span>
          </strong>
        </div>

        {/* KPI 2 : Encours Total Client */}
        <div style={{ background: "#f8fcfa", padding: "14px 16px", borderRadius: "14px", border: "1px solid #e4f0e9" }}>
          <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Encours Total en Souffrance</span>
          <strong
            style={{
              fontSize: "20px",
              fontWeight: 800,
              color: portfolioStats.totalOutstanding > 0 ? "#ef4444" : "#00a86b",
              fontVariantNumeric: "tabular-nums",
              display: "block",
              marginTop: "4px",
            }}
          >
            {formatTreasuryMoney(portfolioStats.totalOutstanding, currency)}
          </strong>
        </div>

        {/* KPI 3 : Clients Fiables (Rang A+/A) */}
        <div style={{ background: "#f8fcfa", padding: "14px 16px", borderRadius: "14px", border: "1px solid #e4f0e9" }}>
          <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Clients Exemplaires (Rang A+/A)</span>
          <strong
            style={{
              fontSize: "22px",
              fontWeight: 800,
              color: "#16a34a",
              fontVariantNumeric: "tabular-nums",
              display: "block",
              marginTop: "4px",
            }}
          >
            {portfolioStats.tierAplusCount} clients
          </strong>
        </div>

        {/* KPI 4 : Clients à Risque Élevé (Rang C/D) */}
        <div style={{ background: "#f8fcfa", padding: "14px 16px", borderRadius: "14px", border: "1px solid #e4f0e9" }}>
          <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Clients à Risque (Rang C/D)</span>
          <strong
            style={{
              fontSize: "22px",
              fontWeight: 800,
              color: portfolioStats.riskCount > 0 ? "#dc2626" : "#64748b",
              fontVariantNumeric: "tabular-nums",
              display: "block",
              marginTop: "4px",
            }}
          >
            {portfolioStats.riskCount} clients
          </strong>
        </div>
      </div>

      {/* 3. Barre de recherche et filtres de rangs */}
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "#f8fcfa",
            border: "1px solid #dceee4",
            borderRadius: "10px",
            padding: "0 12px",
            minWidth: "260px",
            flex: 1,
            maxWidth: "380px",
          }}
        >
          <Search size={15} color="#64748b" />
          <input
            type="text"
            placeholder="Rechercher un client, téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              border: 0,
              outline: 0,
              background: "transparent",
              padding: "10px 0",
              fontSize: "13px",
              width: "100%",
              color: "#0f172a",
            }}
          />
        </div>

        {/* Boutons Filtres */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {[
            { id: "all", label: "Tous" },
            { id: "A+", label: "Exemplaires (A+/A)" },
            { id: "B", label: "Vigilance (B)" },
            { id: "risk", label: "À Risque (C/D)" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedTier(f.id)}
              style={{
                backgroundColor: selectedTier === f.id ? "#00a86b" : "#f1f5f9",
                color: selectedTier === f.id ? "#ffffff" : "#475569",
                border: "none",
                borderRadius: "8px",
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "0.15s ease",
                minHeight: "36px",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Tableau du Portefeuille Client */}
      {filteredClients.length === 0 ? (
        <div
          style={{
            padding: "36px 20px",
            textAlign: "center",
            backgroundColor: "#f9fcfa",
            borderRadius: "14px",
            border: "1px dashed #d1e7dc",
            color: "#64748b",
            fontSize: "14px",
          }}
        >
          Aucun client ne correspond aux critères de filtre.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: "0 6px",
              fontSize: "13px",
            }}
          >
            <thead>
              <tr style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <th style={{ textAlign: "left", padding: "8px 12px" }}>Client</th>
                <th style={{ textAlign: "center", padding: "8px 12px" }}>Solvabilité</th>
                <th style={{ textAlign: "right", padding: "8px 12px" }}>Facturé</th>
                <th style={{ textAlign: "right", padding: "8px 12px" }}>Solde Dû</th>
                <th style={{ textAlign: "left", padding: "8px 12px" }}>Directive Crédit</th>
                <th style={{ textAlign: "center", padding: "8px 12px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => {
                const latestUnpaidSale = client.sales.find((s) => {
                  const t = Number(s.total_amount || 0);
                  const p = Number(s.paid_amount || 0);
                  return t - p > 0;
                });

                return (
                  <tr
                    key={client.clientKey}
                    style={{
                      backgroundColor: "#fbfdfc",
                      border: "1px solid #e5f0ea",
                      borderRadius: "10px",
                      transition: "0.15s ease",
                    }}
                  >
                    {/* Nom & Téléphone */}
                    <td style={{ padding: "12px", borderTopLeftRadius: "10px", borderBottomLeftRadius: "10px" }}>
                      <strong
                        onClick={() => setActiveClientModal(client)}
                        style={{
                          color: "#0f172a",
                          cursor: "pointer",
                          display: "block",
                          textDecoration: "underline",
                          textDecorationColor: "#cbd5e1",
                        }}
                        title="Ouvrir la fiche de solvabilité détaillée"
                      >
                        {client.clientName}
                      </strong>
                      {client.clientPhone && (
                        <span style={{ fontSize: "11px", color: "#64748b" }}>{client.clientPhone}</span>
                      )}
                    </td>

                    {/* Badge Solvabilité */}
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <ClientSolvencyBadge
                        score={client.solvencyScore}
                        tier={client.tier}
                        size="sm"
                        onClick={() => setActiveClientModal(client)}
                      />
                    </td>

                    {/* Facturé */}
                    <td style={{ padding: "12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      {formatTreasuryMoney(client.totalInvoiced, currency)}
                    </td>

                    {/* Solde Impayé */}
                    <td style={{ padding: "12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      <strong style={{ color: client.totalOutstanding > 0 ? "#ef4444" : "#16a34a" }}>
                        {formatTreasuryMoney(client.totalOutstanding, currency)}
                      </strong>
                    </td>

                    {/* Directive Crédit */}
                    <td style={{ padding: "12px", maxWidth: "240px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          color: client.tier === "D" ? "#ef4444" : client.tier === "C" ? "#ea580c" : "#475569",
                          fontWeight: client.tier === "D" || client.tier === "C" ? 700 : 500,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {client.creditPolicy}
                      </span>
                    </td>

                    {/* Action 1-Clic */}
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        borderTopRightRadius: "10px",
                        borderBottomRightRadius: "10px",
                      }}
                    >
                      {latestUnpaidSale ? (
                        <button
                          type="button"
                          className="app-button app-button-secondary"
                          onClick={() =>
                            setActiveReminderSale({
                              sale: latestUnpaidSale,
                              score: client.solvencyScore,
                              tier: client.tier,
                            })
                          }
                          style={{
                            minHeight: "34px",
                            padding: "6px 12px",
                            fontSize: "12px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <Send size={13} color="#25D366" />
                          <span>Relancer</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="app-text-button"
                          onClick={() => setActiveClientModal(client)}
                          style={{ fontSize: "11px", color: "#64748b" }}
                        >
                          Fiche
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Fiche Client Détaillée */}
      <ClientSolvencyModal
        open={Boolean(activeClientModal)}
        onClose={() => setActiveClientModal(null)}
        client={activeClientModal}
        currency={currency}
        onOpenReminder={(sale) => {
          if (activeClientModal) {
            setActiveReminderSale({
              sale,
              score: activeClientModal.solvencyScore,
              tier: activeClientModal.tier,
            });
            setActiveClientModal(null);
          }
        }}
      />

      {/* Dialogue de Relance Stratégique Multi-Tons */}
      {activeReminderSale && (
        <PaymentReminderDialog
          open={Boolean(activeReminderSale)}
          onClose={() => setActiveReminderSale(null)}
          organizationName={organizationName}
          clientScore={activeReminderSale.score}
          clientTier={activeReminderSale.tier}
          sale={{
            ...activeReminderSale.sale,
            currency: activeReminderSale.sale.currency || currency,
          }}
        />
      )}
    </div>
  );
}
