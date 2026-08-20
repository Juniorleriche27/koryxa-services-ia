"use client";

import { useState, useEffect } from "react";
import { Dialog, FormError } from "./Dialog";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { Sparkles, RefreshCw, Calculator, Tag } from "lucide-react";

type Kind = "offers" | "sales" | "procedures";
const today = () => new Date().toISOString().slice(0, 10);
const text = (data: FormData, key: string) => String(data.get(key) || "").trim();
const optional = (data: FormData, key: string) => text(data, key) || null;
const list = (data: FormData, key: string) =>
  text(data, key)
    .split(/[,\n]/)
    .map((value) => value.trim())
    .filter(Boolean);

export function RegisterCreateDialog({
  kind,
  open,
  onClose,
  onCreated,
  record,
}: {
  kind: Kind;
  open: boolean;
  onClose: () => void;
  onCreated: () => Promise<void> | void;
  record?: Record<string, any> | null;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const labels = { offers: "une offre", sales: "une vente / devis / facture", procedures: "une procédure" };
  const editing = Boolean(record?.id);

  // Sales interactive fields
  const [docType, setDocType] = useState<string>(record?.document_type || "invoice");
  const [reference, setReference] = useState<string>(record?.reference || "");
  const [loadingRef, setLoadingRef] = useState(false);
  const [quantity, setQuantity] = useState<number>(Number(record?.quantity) || 1);
  const [unitPrice, setUnitPrice] = useState<number>(Number(record?.unit_price) || 0);
  const [discount, setDiscount] = useState<number>(Number(record?.discount) || 0);
  const [paidAmount, setPaidAmount] = useState<number>(Number(record?.paid_amount) || 0);
  const [paymentStatus, setPaymentStatus] = useState<string>(record?.payment_status || "unpaid");
  const [dueDate, setDueDate] = useState<string>(record?.due_date || "");

  const calculatedTotal = Math.max(0, quantity * unitPrice - discount);
  const balanceDue = Math.max(0, calculatedTotal - paidAmount);

  // Auto-generate reference for sales if not editing
  useEffect(() => {
    if (open && kind === "sales" && !editing && !reference) {
      setLoadingRef(true);
      serviceIaFetch<{ reference: string }>(`/registers/generate-reference?type=${docType}`)
        .then((res) => {
          if (res?.reference) setReference(res.reference);
        })
        .catch(() => {})
        .finally(() => setLoadingRef(false));
    }
  }, [open, kind, docType, editing]);

  const handleDocTypeChange = (newType: string) => {
    setDocType(newType);
    if (!editing) {
      setLoadingRef(true);
      serviceIaFetch<{ reference: string }>(`/registers/generate-reference?type=${newType}`)
        .then((res) => {
          if (res?.reference) setReference(res.reference);
        })
        .catch(() => {})
        .finally(() => setLoadingRef(false));
    }
  };

  const handleApplyPreset = (percent: number) => {
    if (percent === 100) {
      setPaidAmount(calculatedTotal);
      setPaymentStatus("paid");
    } else {
      const val = Math.round((calculatedTotal * percent) / 100);
      setPaidAmount(val);
      setPaymentStatus("partial");
    }
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const data = new FormData(event.currentTarget);
    let payload: Record<string, unknown>;

    if (kind === "offers") {
      payload = {
        name: text(data, "name"),
        description: optional(data, "description"),
        category: optional(data, "category"),
        price: text(data, "price") || null,
        currency: text(data, "currency") || "XOF",
        billing_unit: optional(data, "billing_unit"),
        cost_price: text(data, "cost_price") || null,
        track_stock: data.get("track_stock") === "on" || data.get("track_stock") === "true",
        stock_quantity: text(data, "stock_quantity") ? Number(text(data, "stock_quantity")) : 0,
        min_stock_alert: text(data, "min_stock_alert") ? Number(text(data, "min_stock_alert")) : 5,
        conditions: optional(data, "conditions"),
        inclusions: list(data, "inclusions"),
        exclusions: list(data, "exclusions"),
        effective_from: optional(data, "effective_from"),
        expires_at: optional(data, "expires_at"),
        status: text(data, "status") || "draft",
      };
    } else if (kind === "sales") {
      const phoneInput = optional(data, "client_phone");
      if (phoneInput) {
        const clean = phoneInput.trim();
        if (!clean.startsWith("+") && !clean.startsWith("00")) {
          setError(
            "Le numéro WhatsApp doit obligatoirement inclure l'indicatif international du pays avec '+' (ex: +225..., +33..., +221...)."
          );
          setSaving(false);
          return;
        }
      }

      payload = {
        reference: reference.trim() || undefined,
        document_type: docType,
        sale_date: text(data, "sale_date"),
        due_date: dueDate || null,
        client_name: optional(data, "client_name"),
        client_phone: phoneInput || null,
        item_label: text(data, "item_label"),
        quantity: quantity || 1,
        unit_price: unitPrice || 0,
        discount: discount || 0,
        total_amount: calculatedTotal,
        paid_amount: paidAmount,
        currency: text(data, "currency") || "XOF",
        payment_method: optional(data, "payment_method"),
        payment_status: paymentStatus,
        sales_channel: optional(data, "sales_channel"),
        comment: optional(data, "comment"),
        status: text(data, "status") || "draft",
      };
    } else {
      payload = {
        title: text(data, "title"),
        objective: optional(data, "objective"),
        department: optional(data, "department"),
        trigger: optional(data, "trigger"),
        expected_result: optional(data, "expected_result"),
        participants: list(data, "participants"),
        tools: list(data, "tools"),
        risks: list(data, "risks"),
        validation_date: optional(data, "validation_date"),
        next_review_date: optional(data, "next_review_date"),
        status: text(data, "status") || "draft",
        steps: text(data, "steps")
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean)
          .map((title, index) => ({ position: index + 1, title })),
      };
    }

    try {
      await serviceIaFetch(`/registers/${kind}${editing ? `/${record!.id}` : ""}`, {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      await onCreated();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`${editing ? "Modifier" : "Ajouter"} ${labels[kind]}`}
      description="Les champs marqués * sont obligatoires. Les références sont auto-générées automatiquement."
    >
      <form onSubmit={submit}>
        <div className="app-form-grid">
          {kind === "offers" ? (
            <>
              <label>
                Nom de l&apos;offre / article *
                <input name="name" required minLength={2} defaultValue={record?.name || ""} />
              </label>
              <label>
                Catégorie
                <input name="category" defaultValue={record?.category || ""} />
              </label>
              <label>
                Prix de vente
                <input name="price" type="number" min="0" step="0.01" defaultValue={record?.price || ""} />
              </label>
              <label>
                Prix de revient (Coût)
                <input
                  name="cost_price"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={record?.cost_price || ""}
                  placeholder="Ex: 3500"
                />
              </label>
              <label>
                Devise
                <input name="currency" defaultValue={record?.currency || "XOF"} minLength={3} maxLength={3} />
              </label>
              <label>
                Unité de facturation
                <input
                  name="billing_unit"
                  placeholder="carton, sac, unité, heure…"
                  defaultValue={record?.billing_unit || ""}
                />
              </label>
              <label
                className="app-form-span"
                style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", margin: "4px 0" }}
              >
                <input
                  type="checkbox"
                  name="track_stock"
                  defaultChecked={record?.track_stock ?? true}
                  style={{ width: "auto" }}
                />
                <span>
                  📦 <strong>Activer le suivi du stock physique</strong> (décrémentation automatique lors des ventes)
                </span>
              </label>
              <label>
                Quantité en stock
                <input name="stock_quantity" type="number" step="any" defaultValue={record?.stock_quantity ?? "0"} />
              </label>
              <label>
                Seuil d&apos;alerte stock faible
                <input name="min_stock_alert" type="number" step="any" defaultValue={record?.min_stock_alert ?? "5"} />
              </label>
              <StatusField value={record?.status} />
              <label>
                Date d’effet
                <input name="effective_from" type="date" defaultValue={record?.effective_from || ""} />
              </label>
              <label>
                Date d’expiration
                <input name="expires_at" type="date" defaultValue={record?.expires_at || ""} />
              </label>
              <label className="app-form-span">
                Description
                <textarea name="description" defaultValue={record?.description || ""} />
              </label>
              <label className="app-form-span">
                Conditions
                <textarea name="conditions" defaultValue={record?.conditions || ""} />
              </label>
              <label>
                Inclusions (séparées par virgule)
                <textarea name="inclusions" defaultValue={(record?.inclusions || []).join(", ")} />
              </label>
              <label>
                Exclusions
                <textarea name="exclusions" defaultValue={(record?.exclusions || []).join(", ")} />
              </label>
            </>
          ) : null}

          {kind === "sales" ? (
            <>
              {/* Document Type Selector (Quote, Proforma, Invoice, Receipt) */}
              <div className="app-form-span">
                <label className="text-xs font-bold text-foreground block mb-1">
                  Type de document commercial :
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "invoice", label: "🧾 Facture", desc: "Vente standard" },
                    { id: "quote", label: "🏷️ Devis", desc: "Proposition" },
                    { id: "proforma", label: "📄 Pro Forma", desc: "Devis pro" },
                    { id: "receipt", label: "✅ Reçu / Caisse", desc: "Comptant direct" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleDocTypeChange(t.id)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        docType === t.id
                          ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-extrabold shadow-xs"
                          : "border-border text-muted-foreground hover:border-slate-400"
                      }`}
                    >
                      <div className="text-xs font-bold">{t.label}</div>
                      <div className="text-[10px] text-muted-foreground">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference (Auto-generated) */}
              <label>
                Référence auto-générée *
                <div className="flex items-center gap-1.5 mt-0.5">
                  <input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    required
                    className="font-black tracking-wide text-foreground"
                    placeholder={loadingRef ? "Génération..." : "Ex: FAC-2026-001"}
                  />
                  <button
                    type="button"
                    onClick={() => handleDocTypeChange(docType)}
                    className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground cursor-pointer"
                    title="Régénérer une nouvelle référence"
                  >
                    <RefreshCw size={14} className={loadingRef ? "animate-spin" : ""} />
                  </button>
                </div>
              </label>

              <label>
                Date d&apos;émission *
                <input name="sale_date" type="date" defaultValue={record?.sale_date || today()} required />
              </label>

              <label>
                Client / Destinataire
                <input name="client_name" defaultValue={record?.client_name || ""} placeholder="Nom ou entreprise" />
              </label>

              <label>
                Numéro WhatsApp / Téléphone Client
                <input
                  name="client_phone"
                  defaultValue={record?.client_phone || ""}
                  placeholder="Ex: +225 07 12 34 56 78 ou +33 6 12 34 56 78 (Indicatif obligatoire)"
                />
              </label>

              <label>
                Offre / Prestation / Article *
                <input name="item_label" required defaultValue={record?.item_label || ""} placeholder="Désignation" />
              </label>

              <label>
                Quantité
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                  required
                />
              </label>

              <label>
                Prix unitaire (XOF/Devise)
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(Number(e.target.value) || 0)}
                  required
                />
              </label>

              <label>
                Remise accordée
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                />
              </label>

              <label>
                Montant total calculé
                <input
                  type="text"
                  readOnly
                  value={`${calculatedTotal.toLocaleString("fr-FR")} XOF`}
                  className="font-black bg-muted/50 cursor-not-allowed"
                />
              </label>

              {/* Deposit / Partial payment shortcuts */}
              <div className="app-form-span p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    Acompte ou Paiement partiel :
                  </span>
                  <div className="flex items-center gap-1">
                    {[
                      { l: "25%", p: 25 },
                      { l: "30%", p: 30 },
                      { l: "50%", p: 50 },
                      { l: "100% Solde", p: 100 },
                    ].map((btn) => (
                      <button
                        key={btn.p}
                        type="button"
                        onClick={() => handleApplyPreset(btn.p)}
                        className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-border text-[11px] font-extrabold hover:border-emerald-500 transition cursor-pointer"
                      >
                        {btn.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <label className="m-0">
                    <span className="text-[11px] font-medium text-muted-foreground block mb-0.5">
                      Montant encaissé (Acompte) :
                    </span>
                    <input
                      type="number"
                      min="0"
                      max={calculatedTotal}
                      step="any"
                      value={paidAmount}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setPaidAmount(val);
                        if (val >= calculatedTotal && calculatedTotal > 0) setPaymentStatus("paid");
                        else if (val > 0) setPaymentStatus("partial");
                        else setPaymentStatus("unpaid");
                      }}
                      className="font-black text-emerald-600"
                    />
                  </label>

                  <label className="m-0">
                    <span className="text-[11px] font-medium text-muted-foreground block mb-0.5">
                      Solde restant dû :
                    </span>
                    <input
                      type="text"
                      readOnly
                      value={`${balanceDue.toLocaleString("fr-FR")} XOF`}
                      className={`font-black ${balanceDue > 0 ? "text-amber-600" : "text-emerald-600"}`}
                    />
                  </label>
                </div>
              </div>

              <label>
                Date d&apos;échéance de paiement
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  placeholder="Date limite"
                />
              </label>

              <label>
                État du règlement
                <select
                  value={paymentStatus}
                  onChange={(e) => {
                    const st = e.target.value;
                    setPaymentStatus(st);
                    if (st === "paid") setPaidAmount(calculatedTotal);
                    else if (st === "unpaid") setPaidAmount(0);
                  }}
                >
                  <option value="unpaid">Non payé (0%)</option>
                  <option value="partial">Partiel / Acompte</option>
                  <option value="paid">Payé intégralement (100%)</option>
                  <option value="refunded">Remboursé</option>
                </select>
              </label>

              <label>
                Mode de règlement
                <input
                  name="payment_method"
                  defaultValue={record?.payment_method || "Espèces / Mobile Money"}
                  placeholder="Espèces, Wave, Orange Money, Virement..."
                />
              </label>

              <label>
                Canal de vente
                <input name="sales_channel" defaultValue={record?.sales_channel || "Comptoir"} placeholder="Comptoir, WhatsApp, Direct..." />
              </label>

              <StatusField value={record?.status} />

              <label className="app-form-span">
                Commentaire / Conditions particulières
                <textarea name="comment" defaultValue={record?.comment || ""} placeholder="Conditions de livraison, validité..." />
              </label>
            </>
          ) : null}

          {kind === "procedures" ? (
            <>
              <label>
                Titre *
                <input name="title" required minLength={2} defaultValue={record?.title || ""} />
              </label>
              <label>
                Service concerné
                <input name="department" defaultValue={record?.department || ""} />
              </label>
              <label className="app-form-span">
                Objectif
                <textarea name="objective" defaultValue={record?.objective || ""} />
              </label>
              <label className="app-form-span">
                Déclencheur
                <textarea name="trigger" defaultValue={record?.trigger || ""} />
              </label>
              <label>
                Participants
                <textarea name="participants" defaultValue={(record?.participants || []).join(", ")} />
              </label>
              <label>
                Outils
                <textarea name="tools" defaultValue={(record?.tools || []).join(", ")} />
              </label>
              <label>
                Risques
                <textarea name="risks" defaultValue={(record?.risks || []).join(", ")} />
              </label>
              <StatusField value={record?.status} />
              <label>
                Date de validation
                <input name="validation_date" type="date" defaultValue={record?.validation_date || ""} />
              </label>
              <label>
                Prochaine révision
                <input name="next_review_date" type="date" defaultValue={record?.next_review_date || ""} />
              </label>
              <label className="app-form-span">
                Étapes (une par ligne)
                <textarea
                  name="steps"
                  defaultValue={(record?.steps || []).map((step: any) => step.title).join("\n")}
                  placeholder={"Recevoir la demande\nVérifier les informations\nConfirmer le traitement"}
                />
              </label>
              <label className="app-form-span">
                Résultat attendu
                <textarea name="expected_result" defaultValue={record?.expected_result || ""} />
              </label>
            </>
          ) : null}
        </div>
        <FormError>{error}</FormError>
        <div className="app-form-actions">
          <button type="button" className="app-button app-button-secondary" onClick={onClose}>
            Annuler
          </button>
          <button className="app-button app-button-primary" disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function StatusField({ value }: { value?: string }) {
  return (
    <label>
      Statut de validation
      <select name="status" defaultValue={value || "validated"}>
        <option value="validated">Validé</option>
        <option value="draft">Brouillon</option>
        <option value="to_verify">À vérifier</option>
        <option value="obsolete">Obsolète</option>
      </select>
    </label>
  );
}
