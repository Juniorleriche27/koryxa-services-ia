"use client";

import React, { useEffect, useState } from "react";
import { Dialog } from "./Dialog";
import { StatusPill } from "./Ui";
import { formatMoney, formatDate, formatLabel, SaleItem, OfferItem, ProcedureItem } from "./RegistersTable";
import { Pencil, Archive, Sparkles, Clock, User, ShieldCheck } from "lucide-react";
import { serviceIaFetch } from "@/lib/service-ia/api";

interface HistoryItem {
  id: string;
  action: string;
  user_id: string;
  changes: Record<string, unknown>;
  created_at: string;
}

interface RegisterDetailDialogProps {
  kind: "sales" | "offers" | "procedures";
  record: SaleItem | OfferItem | ProcedureItem | null;
  open: boolean;
  onClose: () => void;
  onEdit: (record: SaleItem | OfferItem | ProcedureItem) => void;
  onArchive: (kind: "sales" | "offers" | "procedures", id: string) => void;
  onAiReminder?: (sale: SaleItem) => void;
}

export function RegisterDetailDialog({
  kind,
  record,
  open,
  onClose,
  onEdit,
  onArchive,
  onAiReminder,
}: RegisterDetailDialogProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!open || !record) return;
    const typeMap = { sales: "sale", offers: "offer", procedures: "procedure" };
    const typ = typeMap[kind];
    if (!typ) return;

    setLoadingHistory(true);
    serviceIaFetch<HistoryItem[]>(`/registers/${typ}/${record.id}/history`)
      .then((data) => setHistory(Array.isArray(data) ? data : []))
      .catch(() => setHistory([]))
      .finally(() => setLoadingHistory(false));
  }, [open, record, kind]);

  if (!open || !record) return null;

  const sale = kind === "sales" ? (record as SaleItem) : null;
  const offer = kind === "offers" ? (record as OfferItem) : null;
  const proc = kind === "procedures" ? (record as ProcedureItem) : null;

  return (
    <Dialog
      open={open}
      title={
        sale
          ? `Vente : ${sale.reference}`
          : offer
          ? `Offre : ${offer.name}`
          : `Procédure : ${proc?.title}`
      }
      description="Fiche détaillée, statut et historique de traçabilité opérationnelle."
      onClose={onClose}
    >
      {/* SALE DETAIL */}
      {sale && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="app-sale-summary">
            <div>
              <span>Montant Total</span>
              <strong>{formatMoney(sale.total_amount, sale.currency)}</strong>
            </div>
            <StatusPill>{formatLabel(sale.payment_status)}</StatusPill>
          </div>

          <div className="app-detail-grid">
            <div>
              <span>Client</span>
              <strong>{sale.client_name || "Non renseigné"}</strong>
            </div>
            <div>
              <span>Date d&apos;opération</span>
              <strong>{formatDate(sale.sale_date)}</strong>
            </div>
            <div>
              <span>Article / Prestation</span>
              <strong>{sale.item_label}</strong>
            </div>
            <div>
              <span>Quantité & Tarif Unitaire</span>
              <strong>
                {sale.quantity} × {formatMoney(sale.unit_price, sale.currency)}
              </strong>
            </div>
            <div>
              <span>Mode de règlement</span>
              <strong>{formatLabel(sale.payment_method || "Non spécifié")}</strong>
            </div>
            <div>
              <span>Canal d&apos;acquisition</span>
              <strong>{formatLabel(sale.sales_channel || "Comptoir / Direct")}</strong>
            </div>
          </div>

          {sale.comment && (
            <div className="app-detail-comment">
              <span>Commentaire & Notes</span>
              <p>{sale.comment}</p>
            </div>
          )}
        </div>
      )}

      {/* OFFER DETAIL */}
      {offer && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="app-sale-summary">
            <div>
              <span>Tarif catalogue</span>
              <strong>{formatMoney(offer.price, offer.currency)}</strong>
            </div>
            <StatusPill>{formatLabel(offer.status)}</StatusPill>
          </div>

          <div className="app-detail-grid">
            <div>
              <span>Catégorie</span>
              <strong>{offer.category || "Général"}</strong>
            </div>
            <div>
              <span>Unité de facturation</span>
              <strong>{offer.billing_unit || "Unité"}</strong>
            </div>
            <div>
              <span>Dernière mise à jour</span>
              <strong>{formatDate(offer.updated_at)}</strong>
            </div>
          </div>

          {offer.conditions && (
            <div className="app-detail-comment">
              <span>Conditions d&apos;application</span>
              <p>{offer.conditions}</p>
            </div>
          )}
        </div>
      )}

      {/* PROCEDURE DETAIL */}
      {proc && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="app-sale-summary">
            <div>
              <span>Département</span>
              <strong>{proc.department || "Général"}</strong>
            </div>
            <StatusPill>{formatLabel(proc.status)}</StatusPill>
          </div>

          <div className="app-detail-grid">
            <div>
              <span>Responsable</span>
              <strong>{proc.responsible_user_id || "Non assigné"}</strong>
            </div>
            <div>
              <span>Version actuelle</span>
              <strong>v{proc.version}</strong>
            </div>
            <div>
              <span>Prochaine révision</span>
              <strong>{formatDate(proc.next_review_date)}</strong>
            </div>
          </div>

          {proc.objective && (
            <div className="app-detail-comment">
              <span>Objectif opérationnel</span>
              <p>{proc.objective}</p>
            </div>
          )}
        </div>
      )}

      {/* AUDIT TRAIL / HISTORY SECTION */}
      <div style={{ marginTop: 20, borderTop: "1px solid var(--kx-border-subtle, #e2e8f0)", paddingTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <ShieldCheck size={16} style={{ color: "var(--kx-primary-color, #0f766e)" }} />
          <strong style={{ fontSize: "0.85rem" }}>Traçabilité & Historique des modifications :</strong>
        </div>

        {loadingHistory && (
          <p style={{ fontSize: "0.8rem", color: "var(--kx-text-muted)" }}>Chargement de l&apos;audit trail…</p>
        )}

        {!loadingHistory && history.length === 0 && (
          <p style={{ fontSize: "0.8rem", color: "var(--kx-text-muted)" }}>
            Création initiale enregistrée. Aucune modification ultérieure.
          </p>
        )}

        {!loadingHistory && history.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 150, overflowY: "auto" }}>
            {history.map((h) => (
              <div
                key={h.id}
                style={{
                  fontSize: "0.78rem",
                  padding: "6px 10px",
                  borderRadius: 6,
                  background: "var(--kx-surface-raised, #f8fafc)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>
                  Action : <strong>{formatLabel(h.action)}</strong> par {h.user_id?.slice(0, 12)}…
                </span>
                <span style={{ color: "var(--kx-text-muted)" }}>{formatDate(h.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ACTIONS */}
      <div className="app-form-actions" style={{ marginTop: 20 }}>
        {sale && sale.payment_status !== "paid" && onAiReminder && (
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={() => {
              onClose();
              onAiReminder(sale);
            }}
          >
            <Sparkles size={15} />
            <span>Relance IA</span>
          </button>
        )}

        <button
          type="button"
          className="app-button app-button-secondary"
          onClick={() => {
            onClose();
            onEdit(record);
          }}
        >
          <Pencil size={15} />
          <span>Modifier</span>
        </button>

        <button
          type="button"
          className="app-button app-button-secondary"
          style={{ color: "#ef4444" }}
          onClick={() => {
            onClose();
            onArchive(kind, record.id);
          }}
        >
          <Archive size={15} />
          <span>Archiver</span>
        </button>

        <button type="button" className="app-button app-button-primary" onClick={onClose}>
          Fermer
        </button>
      </div>
    </Dialog>
  );
}
