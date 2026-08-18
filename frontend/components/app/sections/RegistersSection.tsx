"use client";

import React, { useState, useMemo } from "react";
import { Plus, Search, Sparkles, Pencil, Archive } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { EmptyState, StatusPill } from "../Ui";
import { Dialog } from "../Dialog";
import { RegisterCreateDialog } from "../RegisterCreateDialog";
import { ProcedureGeneratorModal } from "../ProcedureGeneratorModal";
import {
  SalesTableInteractive,
  SaleItem,
  formatMoney,
  formatDate,
  formatLabel,
} from "../RegistersTable";
import { serviceIaFetch } from "@/lib/service-ia/api";

export type OfferItem = {
  id: string;
  name: string;
  category?: string | null;
  description?: string | null;
  status: string;
  price?: string | null;
  currency: string;
  billing_unit?: string | null;
  conditions?: string | null;
  inclusions?: string[];
  exclusions?: string[];
  effective_from?: string | null;
  expires_at?: string | null;
  updated_at: string;
};

export type ProcedureItem = {
  id: string;
  title: string;
  objective?: string | null;
  department?: string | null;
  status: string;
  version: number;
  responsible_user_id?: string | null;
  next_review_date?: string | null;
  trigger?: string | null;
  participants?: string[];
  tools?: string[];
  risks?: string[];
  expected_result?: string | null;
  validation_date?: string | null;
  steps?: Array<{ position: number; title: string; description?: string | null }>;
};

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
  const config = {
    offers: ["Offres & Tarifs", "Conservez un catalogue officiel, ses conditions et sa période de validité."],
    sales: ["Ventes & Recouvrement", "Suivez vos ventes, vos paiements et vos encaissements effectifs."],
    procedures: ["Procédures & Méthodes (SOP)", "Formalisez les modes opératoires, responsables et dates de révision."],
  }[kind];

  const [creating, setCreating] = useState(false);
  const [aiProcedureOpen, setAiProcedureOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedSale, setSelectedSale] = useState<SaleItem | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<OfferItem | null>(null);
  const [selectedProcedure, setSelectedProcedure] = useState<ProcedureItem | null>(null);
  const [editingRecord, setEditingRecord] = useState<Record<string, unknown> | null>(null);

  const offers = kind === "offers" ? (items as OfferItem[]) : [];
  const sales = kind === "sales" ? (items as SaleItem[]) : [];
  const procedures = kind === "procedures" ? (items as ProcedureItem[]) : [];

  const archiveRecord = async (type: "offer" | "sale" | "procedure", id: string) => {
    if (!window.confirm("Archiver cette ligne ? Elle ne sera plus affichée dans le registre actif.")) return;
    await serviceIaFetch(`/registers/${type}/${id}/archive`, { method: "POST" });
    setSelectedSale(null);
    setSelectedOffer(null);
    setSelectedProcedure(null);
    await onReload();
  };

  const filteredOffers = useMemo(() => {
    if (!query.trim()) return offers;
    const q = query.toLowerCase();
    return offers.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        (o.category || "").toLowerCase().includes(q) ||
        (o.description || "").toLowerCase().includes(q)
    );
  }, [offers, query]);

  const filteredProcedures = useMemo(() => {
    if (!query.trim()) return procedures;
    const q = query.toLowerCase();
    return procedures.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.department || "").toLowerCase().includes(q) ||
        (p.objective || "").toLowerCase().includes(q)
    );
  }, [procedures, query]);

  return (
    <>
      <PageHeader
        eyebrow="Registre"
        title={config[0]}
        description={config[1]}
        action={
          <div className="kx-header-actions-row">
            {kind === "procedures" && (
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={() => setAiProcedureOpen(true)}
                title="Générer automatiquement une procédure opérationnelle standardisée"
              >
                <Sparkles size={16} />
                <span>Générer par IA (SOP)</span>
              </button>
            )}
            <button className="app-button app-button-primary" onClick={() => setCreating(true)}>
              <Plus size={16} />
              <span>Ajouter</span>
            </button>
          </div>
        }
      />

      <section className="app-panel">
        {loading && <EmptyState title="Chargement…" detail="Connexion au registre en cours." />}
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
            onSelect={setSelectedSale}
            onRefresh={onReload}
          />
        )}

        {/* Offers Register List */}
        {kind === "offers" && offers.length > 0 && (
          <>
            <div className="app-toolbar">
              <div className="app-search-input">
                <Search size={16} />
                <input
                  placeholder="Rechercher une offre, une catégorie..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="app-list">
              {filteredOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="app-list-row cursor-pointer"
                  onClick={() => setSelectedOffer(offer)}
                >
                  <div className="app-list-main">
                    <strong>{offer.name}</strong>
                    <span>{offer.category || "Général"} · {offer.conditions || "Sans conditions particulières"}</span>
                  </div>
                  <div className="text-right">
                    <strong>{formatMoney(offer.price, offer.currency)}</strong>
                    <div style={{ fontSize: "0.8rem", color: "var(--kx-text-muted)" }}>
                      {formatLabel(offer.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Procedures Register List */}
        {kind === "procedures" && procedures.length > 0 && (
          <>
            <div className="app-toolbar">
              <div className="app-search-input">
                <Search size={16} />
                <input
                  placeholder="Rechercher une procédure..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="app-list">
              {filteredProcedures.map((proc) => (
                <div
                  key={proc.id}
                  className="app-list-row cursor-pointer"
                  onClick={() => setSelectedProcedure(proc)}
                >
                  <div className="app-list-main">
                    <strong>{proc.title}</strong>
                    <span>
                      {proc.department || "Opérations"} · Responsable : {proc.responsible_user_id || "Non assigné"}
                    </span>
                  </div>
                  <div className="text-right">
                    <StatusPill>{formatLabel(proc.status)}</StatusPill>
                    <div style={{ fontSize: "0.8rem", color: "var(--kx-text-muted)", marginTop: 4 }}>
                      v{proc.version} · {proc.steps?.length || 0} étapes
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Offer Details Modal */}
      {selectedOffer && (
        <Dialog
          open
          title={`Offre : ${selectedOffer.name}`}
          description="Tarif officiel et conditions commerciales."
          onClose={() => setSelectedOffer(null)}
        >
          <div className="app-sale-summary">
            <div>
              <span>Tarif officiel</span>
              <strong>{formatMoney(selectedOffer.price, selectedOffer.currency)}</strong>
            </div>
            <StatusPill>{formatLabel(selectedOffer.status)}</StatusPill>
          </div>
          <div className="app-detail-grid">
            <div>
              <span>Catégorie</span>
              <strong>{selectedOffer.category || "Général"}</strong>
            </div>
            <div>
              <span>Unité de facturation</span>
              <strong>{selectedOffer.billing_unit || "Unité"}</strong>
            </div>
            <div>
              <span>Dernière mise à jour</span>
              <strong>{formatDate(selectedOffer.updated_at)}</strong>
            </div>
          </div>
          {selectedOffer.conditions && (
            <div className="app-detail-comment">
              <span>Conditions d&apos;application</span>
              <p>{selectedOffer.conditions}</p>
            </div>
          )}
          <div className="app-form-actions">
            <button
              className="app-button app-button-secondary"
              onClick={() => archiveRecord("offer", selectedOffer.id)}
            >
              <Archive size={15} />
              <span>Archiver</span>
            </button>
            <button className="app-button app-button-secondary" onClick={() => setSelectedOffer(null)}>
              Fermer
            </button>
          </div>
        </Dialog>
      )}

      {/* Procedure Details Modal */}
      {selectedProcedure && (
        <Dialog
          open
          title={`Procédure : ${selectedProcedure.title}`}
          description="Méthode de travail et gouvernance interne."
          onClose={() => setSelectedProcedure(null)}
        >
          <div className="app-sale-summary">
            <div>
              <span>Département</span>
              <strong>{selectedProcedure.department || "Général"}</strong>
            </div>
            <StatusPill>{formatLabel(selectedProcedure.status)}</StatusPill>
          </div>
          <div className="app-detail-grid">
            <div>
              <span>Responsable assigné</span>
              <strong>{selectedProcedure.responsible_user_id || "Non assigné"}</strong>
            </div>
            <div>
              <span>Version</span>
              <strong>v{selectedProcedure.version}</strong>
            </div>
            <div>
              <span>Prochaine révision</span>
              <strong>{formatDate(selectedProcedure.next_review_date)}</strong>
            </div>
          </div>
          {selectedProcedure.objective && (
            <div className="app-detail-comment">
              <span>Objectif attendu</span>
              <p>{selectedProcedure.objective}</p>
            </div>
          )}
          {selectedProcedure.steps && selectedProcedure.steps.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <strong>Étapes standardisées :</strong>
              <ol style={{ paddingLeft: 20, marginTop: 6 }}>
                {selectedProcedure.steps.map((st, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>
                    <strong>{st.title}</strong>
                    {st.description && <p style={{ fontSize: "0.85rem", color: "var(--kx-text-muted)" }}>{st.description}</p>}
                  </li>
                ))}
              </ol>
            </div>
          )}
          <div className="app-form-actions">
            <button
              className="app-button app-button-secondary"
              onClick={() => archiveRecord("procedure", selectedProcedure.id)}
            >
              <Archive size={15} />
              <span>Archiver</span>
            </button>
            <button className="app-button app-button-secondary" onClick={() => setSelectedProcedure(null)}>
              Fermer
            </button>
          </div>
        </Dialog>
      )}

      {/* Creation Modal */}
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

      {/* AI SOP Procedure Generator */}
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
    </>
  );
}
