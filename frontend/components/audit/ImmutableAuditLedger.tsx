"use client";

import React, { useState, useMemo } from "react";
import {
  RawAuditEvent,
  ChainedAuditEvent,
  buildAuditChain,
  formatAuditEventDescription,
} from "@/lib/audit/audit-hash-chain";
import { Dialog } from "../app/Dialog";
import {
  Search,
  Filter,
  Lock,
  Copy,
  Check,
  Eye,
  ShieldCheck,
  Clock,
  User,
  ArrowRight,
} from "lucide-react";

interface ImmutableAuditLedgerProps {
  events: RawAuditEvent[];
}

export function ImmutableAuditLedger({ events }: ImmutableAuditLedgerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [inspectingEvent, setInspectingEvent] = useState<ChainedAuditEvent | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Construction de la chaîne cryptographique
  const chainedEvents = useMemo(() => {
    return buildAuditChain(events).reverse(); // Affichage du plus récent au plus ancien
  }, [events]);

  // Filtrage
  const filteredEvents = useMemo(() => {
    return chainedEvents.filter((ev) => {
      const desc = formatAuditEventDescription(ev);
      const matchCategory =
        filterCategory === "all" || desc.category === filterCategory;

      const q = searchTerm.toLowerCase();
      const matchSearch =
        ev.event_type.toLowerCase().includes(q) ||
        ev.actor_user_id.toLowerCase().includes(q) ||
        ev.id.toLowerCase().includes(q) ||
        JSON.stringify(ev.payload).toLowerCase().includes(q);

      return matchCategory && matchSearch;
    });
  }, [chainedEvents, filterCategory, searchTerm]);

  const handleCopyHash = async (hash: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(hash);
        setCopiedHash(hash);
        setTimeout(() => setCopiedHash(null), 2000);
      }
    } catch {}
  };

  const truncated = (str: string, len = 10) => {
    if (!str || str.length <= len) return str;
    return `${str.slice(0, 6)}...${str.slice(-4)}`;
  };

  return (
    <div
      className="cauri-immutable-ledger"
      style={{
        background: "#ffffff",
        borderRadius: "18px",
        padding: "20px",
        border: "1px solid #dceee4",
        boxShadow: "0 12px 34px rgba(39, 94, 65, 0.05)",
      }}
    >
      {/* Barre de recherche et filtres de catégorie */}
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
            placeholder="Rechercher par acteur, ID, contenu..."
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

        {/* Filtres de catégorie */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {[
            { id: "all", label: "Toutes les écritures" },
            { id: "sale", label: "Ventes" },
            { id: "expense", label: "Dépenses" },
            { id: "smartdoc", label: "SmartDocs" },
            { id: "validation", label: "Validations" },
            { id: "caisse", label: "Caisse" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilterCategory(cat.id)}
              style={{
                backgroundColor: filterCategory === cat.id ? "#00a86b" : "#f1f5f9",
                color: filterCategory === cat.id ? "#ffffff" : "#475569",
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
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau du Journal d'Audit Immuable */}
      {filteredEvents.length === 0 ? (
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
          Aucune écriture d&apos;audit ne correspond aux filtres actuels.
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
                <th style={{ textAlign: "left", padding: "8px 10px", width: "70px" }}>Bloc</th>
                <th style={{ textAlign: "left", padding: "8px 10px" }}>Date & Heure</th>
                <th style={{ textAlign: "left", padding: "8px 10px" }}>Événement</th>
                <th style={{ textAlign: "left", padding: "8px 10px" }}>Acteur</th>
                <th style={{ textAlign: "center", padding: "8px 10px" }}>Empreinte SHA-256</th>
                <th style={{ textAlign: "center", padding: "8px 10px" }}>Diff</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((ev) => {
                const desc = formatAuditEventDescription(ev);
                const isCopied = copiedHash === ev.hash;

                return (
                  <tr
                    key={ev.id}
                    style={{
                      backgroundColor: "#fbfdfc",
                      border: "1px solid #e5f0ea",
                      borderRadius: "10px",
                    }}
                  >
                    {/* Séquence / Bloc */}
                    <td style={{ padding: "12px 10px", borderTopLeftRadius: "10px", borderBottomLeftRadius: "10px" }}>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontWeight: 800,
                          color: "#64748b",
                          fontSize: "12px",
                        }}
                      >
                        #{String(ev.sequence_number).padStart(4, "0")}
                      </span>
                    </td>

                    {/* Date & Heure */}
                    <td style={{ padding: "12px 10px", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Clock size={13} color="#94a3b8" />
                        <span style={{ color: "#1e293b", fontWeight: 600 }}>
                          {new Date(ev.created_at).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                        <span style={{ fontSize: "11px", color: "#64748b" }}>
                          {new Date(ev.created_at).toLocaleTimeString("fr-FR")}
                        </span>
                      </div>
                    </td>

                    {/* Événement & Badge */}
                    <td style={{ padding: "12px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "999px",
                            backgroundColor: desc.badgeBg,
                            color: desc.badgeColor,
                          }}
                        >
                          {desc.title}
                        </span>
                      </div>
                      <small style={{ color: "#64748b", fontSize: "11px", display: "block", marginTop: "2px" }}>
                        {ev.entity_type} • {ev.event_type}
                      </small>
                    </td>

                    {/* Acteur */}
                    <td style={{ padding: "12px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <User size={13} color="#64748b" />
                        <span style={{ color: "#334155", fontWeight: 600 }}>
                          {ev.actor_user_id || "Système"}
                        </span>
                      </div>
                    </td>

                    {/* Empreinte Cryptographique SHA-256 */}
                    <td style={{ padding: "12px 10px", textAlign: "center" }}>
                      <button
                        type="button"
                        onClick={() => handleCopyHash(ev.hash)}
                        style={{
                          backgroundColor: isCopied ? "#e8f8f0" : "rgba(15, 23, 42, 0.05)",
                          border: isCopied ? "1px solid #22c55e" : "1px solid rgba(15, 23, 42, 0.1)",
                          borderRadius: "6px",
                          padding: "3px 8px",
                          fontFamily: "monospace",
                          fontSize: "11px",
                          color: isCopied ? "#16a34a" : "#334155",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          transition: "0.15s ease",
                        }}
                        title={`Hash SHA-256 : ${ev.hash}. Cliquez pour copier.`}
                      >
                        <Lock size={10} color={isCopied ? "#16a34a" : "#64748b"} />
                        <span>{truncated(ev.hash, 8)}</span>
                        {isCopied ? <Check size={10} /> : <Copy size={10} />}
                      </button>
                    </td>

                    {/* Bouton Examiner le Diff */}
                    <td
                      style={{
                        padding: "12px 10px",
                        textAlign: "center",
                        borderTopRightRadius: "10px",
                        borderBottomRightRadius: "10px",
                      }}
                    >
                      <button
                        type="button"
                        className="app-text-button"
                        onClick={() => setInspectingEvent(ev)}
                        style={{
                          fontSize: "12px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "4px 8px",
                        }}
                        title="Voir les détails de l'écriture et les métadonnées"
                      >
                        <Eye size={13} />
                        <span>Diff</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal d'inspection de l'événement et du diff */}
      {inspectingEvent && (
        <Dialog
          open
          title={`Écriture certifiée #${inspectingEvent.sequence_number}`}
          description={`Événement : ${inspectingEvent.event_type} (${inspectingEvent.entity_type})`}
          onClose={() => setInspectingEvent(null)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Données d'empreinte cryptographique */}
            <div
              style={{
                backgroundColor: "#0f172a",
                borderRadius: "12px",
                padding: "14px",
                color: "#f8fafc",
                fontFamily: "monospace",
                fontSize: "12px",
              }}
            >
              <div style={{ marginBottom: "8px" }}>
                <span style={{ color: "#94a3b8" }}>Bloc Hash SHA-256 :</span>
                <div style={{ color: "#22c55e", wordBreak: "break-all", fontWeight: 700 }}>
                  {inspectingEvent.hash}
                </div>
              </div>
              <div>
                <span style={{ color: "#94a3b8" }}>Previous Hash :</span>
                <div style={{ color: "#38bdf8", wordBreak: "break-all" }}>
                  {inspectingEvent.previous_hash}
                </div>
              </div>
            </div>

            {/* Métadonnées de l'acteur et de la transaction */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                fontSize: "13px",
              }}
            >
              <div style={{ background: "#f8fcfa", padding: "10px", borderRadius: "8px", border: "1px solid #e4f0e9" }}>
                <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Acteur / Auteur</span>
                <strong style={{ color: "#0f172a" }}>{inspectingEvent.actor_user_id}</strong>
              </div>
              <div style={{ background: "#f8fcfa", padding: "10px", borderRadius: "8px", border: "1px solid #e4f0e9" }}>
                <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Horodatage Certifié</span>
                <strong style={{ color: "#0f172a" }}>
                  {new Date(inspectingEvent.created_at).toLocaleString("fr-FR")}
                </strong>
              </div>
            </div>

            {/* Contenu JSON / Diff du Payload */}
            <div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "6px" }}>
                Charge utile (Payload immuable) :
              </span>
              <pre
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "12px",
                  fontSize: "12px",
                  maxHeight: "220px",
                  overflowY: "auto",
                  color: "#0f172a",
                }}
              >
                {JSON.stringify(inspectingEvent.payload, null, 2)}
              </pre>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={() => setInspectingEvent(null)}
                style={{ minHeight: "44px" }}
              >
                Fermer
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
