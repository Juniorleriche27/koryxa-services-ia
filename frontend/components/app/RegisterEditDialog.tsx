"use client";
import { useI18n } from "@/lib/i18n";

import React, { useState } from "react";
import { Dialog, FormError } from "./Dialog";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { SaleItem, OfferItem, ProcedureItem } from "./RegistersTable";

interface RegisterEditDialogProps {
  kind: "sales" | "offers" | "procedures";
  record: SaleItem | OfferItem | ProcedureItem | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function RegisterEditDialog({
  kind,
  record,
  open,
  onClose,
  onSaved,
}: RegisterEditDialogProps) {
  const { t } = useI18n();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sale form state
  const sale = kind === "sales" ? (record as SaleItem) : null;
  const [saleReference, setSaleReference] = useState(sale?.reference || "");
  const [saleDate, setSaleDate] = useState(sale?.sale_date || "");
  const [saleClient, setSaleClient] = useState(sale?.client_name || "");
  const [saleClientPhone, setSaleClientPhone] = useState(sale?.client_phone || "");
  const [saleItemLabel, setSaleItemLabel] = useState(sale?.item_label || "");
  const [saleQuantity, setSaleQuantity] = useState(sale?.quantity != null ? String(sale.quantity) : "1");
  const [saleUnitPrice, setSaleUnitPrice] = useState(sale?.unit_price != null ? String(sale.unit_price) : "0");
  const [saleTotalAmount, setSaleTotalAmount] = useState(sale?.total_amount != null ? String(sale.total_amount) : "0");
  const [saleCurrency, setSaleCurrency] = useState(sale?.currency || "XOF");
  const [salePaymentStatus, setSalePaymentStatus] = useState(sale?.payment_status || "paid");
  const [salePaymentMethod, setSalePaymentMethod] = useState(sale?.payment_method || "virement");
  const [saleSalesChannel, setSaleSalesChannel] = useState(sale?.sales_channel || "direct");
  const [saleComment, setSaleComment] = useState(sale?.comment || "");

  // Offer form state
  const offer = kind === "offers" ? (record as OfferItem) : null;
  const [offerName, setOfferName] = useState(offer?.name || "");
  const [offerCategory, setOfferCategory] = useState(offer?.category || "Général");
  const [offerPrice, setOfferPrice] = useState(offer?.price || "");
  const [offerCurrency, setOfferCurrency] = useState(offer?.currency || "XOF");
  const [offerBillingUnit, setOfferBillingUnit] = useState(offer?.billing_unit || "Unité");
  const [offerCostPrice, setOfferCostPrice] = useState(offer?.cost_price ? String(offer.cost_price) : "");
  const [offerTrackStock, setOfferTrackStock] = useState(offer?.track_stock ?? true);
  const [offerStockQuantity, setOfferStockQuantity] = useState(offer?.stock_quantity ? String(offer.stock_quantity) : "0");
  const [offerMinStockAlert, setOfferMinStockAlert] = useState(offer?.min_stock_alert ? String(offer.min_stock_alert) : "5");
  const [offerConditions, setOfferConditions] = useState(offer?.conditions || "");
  const [offerDescription, setOfferDescription] = useState(offer?.description || "");
  const [offerStatus, setOfferStatus] = useState(offer?.status || "active");

  // Procedure form state
  const proc = kind === "procedures" ? (record as ProcedureItem) : null;
  const [procTitle, setProcTitle] = useState(proc?.title || "");
  const [procObjective, setProcObjective] = useState(proc?.objective || "");
  const [procDepartment, setProcDepartment] = useState(proc?.department || "Général");
  const [procResponsible, setProcResponsible] = useState(proc?.responsible_user_id || "");
  const [procStatus, setProcStatus] = useState(proc?.status || "draft");
  const [procNextReview, setProcNextReview] = useState(proc?.next_review_date || "");

  if (!open || !record) return null;

  const handleUnitPriceOrQtyChange = (unit: string, qty: string) => {
    setSaleUnitPrice(unit);
    setSaleQuantity(qty);
    const u = parseFloat(unit) || 0;
    const q = parseFloat(qty) || 0;
    if (u > 0 && q > 0) {
      setSaleTotalAmount(String(u * q));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (kind === "sales" && sale) {
        const cleanPhone = saleClientPhone.trim();
        if (cleanPhone && !cleanPhone.startsWith("+") && !cleanPhone.startsWith("00")) {
          setError(
            "Le numéro WhatsApp doit obligatoirement inclure l'indicatif international du pays avec '+' (ex: +225..., +33..., +221...)."
          );
          setSubmitting(false);
          return;
        }

        await serviceIaFetch(`/registers/sales/${sale.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reference: saleReference,
            sale_date: saleDate,
            client_name: saleClient || null,
            client_phone: cleanPhone || null,
            item_label: saleItemLabel,
            quantity: saleQuantity,
            unit_price: saleUnitPrice,
            total_amount: saleTotalAmount,
            currency: saleCurrency,
            payment_status: salePaymentStatus,
            payment_method: salePaymentMethod || null,
            sales_channel: saleSalesChannel || null,
            comment: saleComment || null,
          }),
        });
      } else if (kind === "offers" && offer) {
        await serviceIaFetch(`/registers/offers/${offer.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: offerName,
            category: offerCategory,
            price: offerPrice ? String(offerPrice) : null,
            currency: offerCurrency,
            billing_unit: offerBillingUnit,
            cost_price: offerCostPrice ? String(offerCostPrice) : null,
            track_stock: offerTrackStock,
            stock_quantity: offerStockQuantity ? Number(offerStockQuantity) : 0,
            min_stock_alert: offerMinStockAlert ? Number(offerMinStockAlert) : 5,
            conditions: offerConditions || null,
            description: offerDescription || null,
            status: offerStatus,
          }),
        });
      } else if (kind === "procedures" && proc) {
        await serviceIaFetch(`/registers/procedures/${proc.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: procTitle,
            objective: procObjective || null,
            department: procDepartment || null,
            responsible_user_id: procResponsible || null,
            status: procStatus,
            next_review_date: procNextReview || null,
          }),
        });
      }

      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la mise à jour");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      title={`${t("form_edit_prefix")} ${kind === "sales" ? t("form_sale_singular") : kind === "offers" ? t("form_offer_singular") : t("form_proc_singular")}`}
      description="Mettez à jour les informations enregistrées. Les modifications sont historisées."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="app-form">
        {error && <FormError>{error}</FormError>}

        {/* SALE EDIT FORM */}
        {kind === "sales" && (
          <>
            <div className="app-form-grid">
              <label>
                <span>Référence vente *</span>
                <input
                  required
                  value={saleReference}
                  onChange={(e) => setSaleReference(e.target.value)}
                />
              </label>
              <label>
                <span>Date de la vente *</span>
                <input
                  type="date"
                  required
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                />
              </label>
            </div>

            <div className="app-form-grid">
              <label>
                <span>Nom du Client</span>
                <input
                  placeholder="Ex: Entreprise Martin, Client Particulier..."
                  value={saleClient}
                  onChange={(e) => setSaleClient(e.target.value)}
                />
              </label>
              <label>
                <span>Numéro WhatsApp / Téléphone Client</span>
                <input
                  placeholder="Ex: +225 07 12 34 56 78 ou +33 6 12 34 56 78 (Indicatif obligatoire)"
                  value={saleClientPhone}
                  onChange={(e) => setSaleClientPhone(e.target.value)}
                />
              </label>
            </div>

            <div className="app-form-grid">
              <label className="app-form-span">
                <span>Désignation / Article *</span>
                <input
                  required
                  placeholder="Ex: Prestation Conseil, Licence..."
                  value={saleItemLabel}
                  onChange={(e) => setSaleItemLabel(e.target.value)}
                />
              </label>
            </div>

            <div className="app-form-grid">
              <label>
                <span>Quantité *</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={saleQuantity}
                  placeholder="1"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleUnitPriceOrQtyChange(saleUnitPrice, e.target.value)}
                />
              </label>
              <label>
                <span>Prix unitaire *</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={saleUnitPrice}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleUnitPriceOrQtyChange(e.target.value, saleQuantity)}
                />
              </label>
            </div>

            <div className="app-form-grid">
              <label>
                <span>Montant Total Réglé / Dû *</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={saleTotalAmount}
                  placeholder="0"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setSaleTotalAmount(e.target.value)}
                />
              </label>
              <label>
                <span>Devise</span>
                <select value={saleCurrency} onChange={(e) => setSaleCurrency(e.target.value)}>
                  <option value="XOF">XOF (FCFA)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </label>
            </div>

            <div className="app-form-grid">
              <label>
                <span>État du Paiement *</span>
                <select
                  value={salePaymentStatus}
                  onChange={(e) => setSalePaymentStatus(e.target.value)}
                >
                  <option value="paid">Payé (Encaissé)</option>
                  <option value="unpaid">Non payé (En attente / Créance)</option>
                  <option value="partial">Partiellement payé</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </label>
              <label>
                <span>Mode de règlement</span>
                <select
                  value={salePaymentMethod}
                  onChange={(e) => setSalePaymentMethod(e.target.value)}
                >
                  <option value="virement">Virement bancaire</option>
                  <option value="especes">Espèces</option>
                  <option value="cheque">Chèque</option>
                  <option value="carte">Carte bancaire</option>
                  <option value="mobile_money">Mobile Money (Wave / Orange / MTN)</option>
                </select>
              </label>
            </div>

            <label>
              <span>Commentaire / Notes internes</span>
              <textarea
                rows={2}
                placeholder="Précisions de facturation, numéro de devis..."
                value={saleComment}
                onChange={(e) => setSaleComment(e.target.value)}
              />
            </label>
          </>
        )}

        {/* OFFER EDIT FORM */}
        {kind === "offers" && (
          <>
            <div className="app-form-grid">
              <label>
                <span>Nom de l&apos;offre / Service *</span>
                <input
                  required
                  value={offerName}
                  onChange={(e) => setOfferName(e.target.value)}
                />
              </label>
              <label>
                <span>Catégorie *</span>
                <input
                  required
                  placeholder="Ex: SaaS, Prestation, Formation, Produit..."
                  value={offerCategory}
                  onChange={(e) => setOfferCategory(e.target.value)}
                />
              </label>
            </div>

            <div className="app-form-grid">
              <label>
                <span>Tarif de vente</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 50000"
                  value={offerPrice}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setOfferPrice(e.target.value)}
                />
              </label>
              <label>
                <span>Prix de revient (Coût d'achat)</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 35000"
                  value={offerCostPrice}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setOfferCostPrice(e.target.value)}
                />
              </label>
            </div>

            <div className="app-form-grid">
              <label>
                <span>Unité de facturation</span>
                <input
                  placeholder="Ex: carton, sac, pièce, heure..."
                  value={offerBillingUnit}
                  onChange={(e) => setOfferBillingUnit(e.target.value)}
                />
              </label>
              <label>
                <span>Devise</span>
                <select value={offerCurrency} onChange={(e) => setOfferCurrency(e.target.value)}>
                  <option value="XOF">XOF (FCFA)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </label>
            </div>

            <div style={{ margin: "6px 0", padding: "10px", background: "var(--kx-panel-bg, rgba(0,0,0,0.02))", borderRadius: "8px", border: "1px solid var(--kx-border-color, #e5e7eb)" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 8 }}>
                <input
                  type="checkbox"
                  checked={offerTrackStock}
                  onChange={(e) => setOfferTrackStock(e.target.checked)}
                  style={{ width: "auto" }}
                />
                <strong>📦 Activer le suivi des stocks physiques</strong>
              </label>

              {offerTrackStock && (
                <div className="app-form-grid" style={{ marginTop: 8 }}>
                  <label>
                    <span>Quantité actuelle en stock</span>
                    <input
                      type="number"
                      step="any"
                      placeholder="0"
                      value={offerStockQuantity}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setOfferStockQuantity(e.target.value)}
                    />
                  </label>
                  <label>
                    <span>Seuil d'alerte stock faible</span>
                    <input
                      type="number"
                      step="any"
                      placeholder="5"
                      value={offerMinStockAlert}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setOfferMinStockAlert(e.target.value)}
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="app-form-grid">
              <label>
                <span>Statut de l&apos;offre</span>
                <select value={offerStatus} onChange={(e) => setOfferStatus(e.target.value)}>
                  <option value="active">Active (Au catalogue)</option>
                  <option value="draft">Brouillon</option>
                  <option value="archived">Archivée</option>
                </select>
              </label>
            </div>

            <label>
              <span>Conditions d&apos;application & Délais</span>
              <textarea
                rows={2}
                placeholder="Ex: Acompte 30% à la commande, solde à la livraison..."
                value={offerConditions}
                onChange={(e) => setOfferConditions(e.target.value)}
              />
            </label>

            <label>
              <span>Description détaillée</span>
              <textarea
                rows={2}
                placeholder="Détail des livrables inclus..."
                value={offerDescription}
                onChange={(e) => setOfferDescription(e.target.value)}
              />
            </label>
          </>
        )}

        {/* PROCEDURE EDIT FORM */}
        {kind === "procedures" && (
          <>
            <div className="app-form-grid">
              <label>
                <span>Titre de la méthode / SOP *</span>
                <input
                  required
                  value={procTitle}
                  onChange={(e) => setProcTitle(e.target.value)}
                />
              </label>
              <label>
                <span>Département concerné *</span>
                <input
                  required
                  placeholder="Ex: Vente, Support, Technique, Finance..."
                  value={procDepartment}
                  onChange={(e) => setProcDepartment(e.target.value)}
                />
              </label>
            </div>

            <div className="app-form-grid">
              <label>
                <span>Responsable de référence</span>
                <input
                  placeholder="Ex: Responsable Commercial, Lead Tech..."
                  value={procResponsible}
                  onChange={(e) => setProcResponsible(e.target.value)}
                />
              </label>
              <label>
                <span>Statut de conformité</span>
                <select value={procStatus} onChange={(e) => setProcStatus(e.target.value)}>
                  <option value="active">Active & Validée</option>
                  <option value="draft">Brouillon / En révision</option>
                  <option value="archived">Obsolète / Archivée</option>
                </select>
              </label>
            </div>

            <label>
              <span>Date de prochaine révision prévue</span>
              <input
                type="date"
                value={procNextReview}
                onChange={(e) => setProcNextReview(e.target.value)}
              />
            </label>

            <label>
              <span>Objectif opérationnel attendu</span>
              <textarea
                rows={3}
                placeholder="Quel est le résultat garanti si cette méthode est appliquée ?"
                value={procObjective}
                onChange={(e) => setProcObjective(e.target.value)}
              />
            </label>
          </>
        )}

        <div className="app-form-actions">
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            {t("common_cancel")}
          </button>
          <button
            type="submit"
            className="app-button app-button-primary"
            disabled={submitting}
          >
            {submitting ? t("common_loading") : t("form_btn_save")}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
