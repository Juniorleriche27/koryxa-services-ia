"use client";

import React, { useState, useEffect } from "react";
import { Plus, Sparkles, ShoppingBag, Package } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { EmptyState } from "../Ui";
import { RegisterCreateDialog } from "../RegisterCreateDialog";
import { RegisterEditDialog } from "../RegisterEditDialog";
import { RegisterDetailDialog } from "../RegisterDetailDialog";
import { ProcedureGeneratorModal } from "../ProcedureGeneratorModal";
import { PaymentReminderDialog } from "../PaymentReminderDialog";
import { StockAdjustmentDialog } from "../StockAdjustmentDialog";
import { ExpressPosModal } from "../ExpressPosModal";
import {
  SalesTableInteractive,
  OffersTableInteractive,
  ProceduresTableInteractive,
  SaleItem,
  OfferItem,
  ProcedureItem,
} from "../RegistersTable";
export type { OfferItem, ProcedureItem, SaleItem };
import { serviceIaFetch } from "@/lib/service-ia/api";
import { getBusinessCategoryConfig, BusinessCategory } from "@/lib/service-ia/business-categories";

export function RegistersSection({
  kind,
  items,
  loading,
  error,
  onReload,
}: {
  kind: "offers" | "sales" | "procedures";
  items: unknown[];
  loading: boolean;
  error: string;
  onReload: () => Promise<void>;
}) {
  const [businessCategory, setBusinessCategory] = useState<string>("retail");
  const [posOpen, setPosOpen] = useState(false);
  const [allOffers, setAllOffers] = useState<OfferItem[]>([]);
  const [adjustingStockOffer, setAdjustingStockOffer] = useState<OfferItem | null>(null);

  useEffect(() => {
    serviceIaFetch<{ business_category?: string }>("/organizations/current")
      .then((org) => {
        if (org.business_category) setBusinessCategory(org.business_category);
      })
      .catch(() => {});

    // Pre-fetch offers for POS
    serviceIaFetch<any>("/registers/offers")
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.items || []);
        setAllOffers(list);
      })
      .catch(() => {});

    const updated = (e: Event) => {
      const cat = (e as CustomEvent<any>)?.detail?.business_category;
      if (cat) setBusinessCategory(cat);
    };
    window.addEventListener("koryxa:organization-updated", updated);
    return () => window.removeEventListener("koryxa:organization-updated", updated);
  }, []);

  const proConfig = getBusinessCategoryConfig(businessCategory);
  const regConfig = proConfig.registers[kind];

  const [creating, setCreating] = useState(false);
  const [aiProcedureOpen, setAiProcedureOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<
    SaleItem | OfferItem | ProcedureItem | null
  >(null);
  const [editingRecord, setEditingRecord] = useState<
    SaleItem | OfferItem | ProcedureItem | null
  >(null);
  const [reminderSale, setReminderSale] = useState<SaleItem | null>(null);

  const offers = kind === "offers" ? (items as OfferItem[]) : [];
  const sales = kind === "sales" ? (items as SaleItem[]) : [];
  const procedures = kind === "procedures" ? (items as ProcedureItem[]) : [];

  const archiveRecord = async (
    targetKind: "sales" | "offers" | "procedures",
    id: string
  ) => {
    const typeMap = { sales: "sale", offers: "offer", procedures: "procedure" };
    const typ = typeMap[targetKind];
    if (!window.confirm("Archiver cette ligne ? Elle ne sera plus affichée dans le registre actif.")) {
      return;
    }
    try {
      await serviceIaFetch(`/registers/${typ}/${id}/archive`, { method: "POST" });
      setSelectedRecord(null);
      setEditingRecord(null);
      await onReload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur lors de l'archivage");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow={proConfig.badge}
        title={regConfig.title}
        description={regConfig.subtitle}
        action={
          <div className="kx-header-actions-row">
            {(kind === "sales" || kind === "offers") && (
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={() => setPosOpen(true)}
                title="Ouvrir la caisse tactile comptoir pour encaissement rapide"
              >
                <ShoppingBag size={16} className="text-emerald-600 dark:text-emerald-400" />
                <span>Mode Caisse Express (POS)</span>
              </button>
            )}

            {kind === "procedures" && (
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={() => setAiProcedureOpen(true)}
                title="Générer automatiquement une méthode standardisée par IA"
              >
                <Sparkles size={16} />
                <span>Générer par IA (SOP)</span>
              </button>
            )}

            <button
              className="app-button app-button-primary"
              onClick={() => setCreating(true)}
            >
              <Plus size={16} />
              <span>Ajouter un(e) {regConfig.singular}</span>
            </button>
          </div>
        }
      />

      <section className="app-panel">
        {loading && (
          <EmptyState
            title="Chargement…"
            detail="Connexion au registre en cours."
          />
        )}
        {error && <EmptyState title="Données indisponibles" detail={error} />}
        {!loading && !error && items.length === 0 && (
          <EmptyState
            title="Aucune donnée enregistrée"
            detail="Aucun élément n'a encore été créé dans ce registre pour votre organisation."
          />
        )}

        {/* Specialized Interactive Table for Sales */}
        {kind === "sales" && sales.length > 0 && (
          <SalesTableInteractive
            sales={sales}
            onSelect={(sale) => setSelectedRecord(sale)}
            onEdit={(sale) => setEditingRecord(sale)}
            onArchive={(id) => archiveRecord("sales", id)}
            onRefresh={onReload}
          />
        )}

        {/* Specialized Interactive Table for Offers */}
        {kind === "offers" && offers.length > 0 && (
          <OffersTableInteractive
            offers={offers}
            onSelect={(offer) => setSelectedRecord(offer)}
            onEdit={(offer) => setEditingRecord(offer)}
            onArchive={(id) => archiveRecord("offers", id)}
            onAdjustStock={(offer) => setAdjustingStockOffer(offer)}
          />
        )}

        {/* Specialized Interactive Table for Procedures */}
        {kind === "procedures" && procedures.length > 0 && (
          <ProceduresTableInteractive
            procedures={procedures}
            onSelect={(proc) => setSelectedRecord(proc)}
            onEdit={(proc) => setEditingRecord(proc)}
            onArchive={(id) => archiveRecord("procedures", id)}
          />
        )}
      </section>

      {/* Stock Adjustment Dialog */}
      {adjustingStockOffer && (
        <StockAdjustmentDialog
          offer={adjustingStockOffer}
          onClose={() => setAdjustingStockOffer(null)}
          onSuccess={async () => {
            setAdjustingStockOffer(null);
            await onReload();
          }}
        />
      )}

      {/* Express POS Checkout Modal */}
      {posOpen && (
        <ExpressPosModal
          open={posOpen}
          offers={allOffers.length > 0 ? allOffers : offers}
          onClose={() => setPosOpen(false)}
          onSaleCompleted={async () => {
            await onReload();
          }}
        />
      )}

      {/* Record Detail & History Audit Trail Dialog */}
      {selectedRecord && (
        <RegisterDetailDialog
          kind={kind}
          record={selectedRecord}
          open={Boolean(selectedRecord)}
          onClose={() => setSelectedRecord(null)}
          onEdit={(rec) => {
            setSelectedRecord(null);
            setEditingRecord(rec);
          }}
          onArchive={archiveRecord}
          onAiReminder={(s) => setReminderSale(s)}
        />
      )}

      {/* Record Edit Dialog */}
      {editingRecord && (
        <RegisterEditDialog
          kind={kind}
          record={editingRecord}
          open={Boolean(editingRecord)}
          onClose={() => setEditingRecord(null)}
          onSaved={() => {
            setEditingRecord(null);
            void onReload();
          }}
        />
      )}

      {/* Record Creation Modal */}
      {creating && (
        <RegisterCreateDialog
          kind={kind}
          open={creating}
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            void onReload();
          }}
        />
      )}

      {/* AI SOP Procedure Generator Modal */}
      {aiProcedureOpen && (
        <ProcedureGeneratorModal
          open={aiProcedureOpen}
          onClose={() => setAiProcedureOpen(false)}
          onProcedureCreated={() => {
            setAiProcedureOpen(false);
            void onReload();
          }}
        />
      )}

      {/* Payment Reminder AI Modal */}
      {reminderSale && (
        <PaymentReminderDialog
          open={Boolean(reminderSale)}
          onClose={() => setReminderSale(null)}
          sale={reminderSale}
        />
      )}
    </>
  );
}
