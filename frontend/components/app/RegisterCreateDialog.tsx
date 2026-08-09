"use client";

import { useState } from "react";
import { Dialog, FormError } from "./Dialog";
import { serviceIaFetch } from "@/lib/service-ia/api";

type Kind = "offers" | "sales" | "procedures";
const today = () => new Date().toISOString().slice(0, 10);
const text = (data: FormData, key: string) => String(data.get(key) || "").trim();
const optional = (data: FormData, key: string) => text(data, key) || null;
const list = (data: FormData, key: string) => text(data, key).split(/[,\n]/).map(value => value.trim()).filter(Boolean);

export function RegisterCreateDialog({ kind, open, onClose, onCreated, record }: { kind: Kind; open: boolean; onClose: () => void; onCreated: () => Promise<void> | void; record?: Record<string, any> | null }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const labels = { offers: "une offre", sales: "une vente", procedures: "une procédure" };
  const editing = Boolean(record?.id);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setError("");
    const data = new FormData(event.currentTarget);
    let payload: Record<string, unknown>;
    if (kind === "offers") payload = {
      name: text(data,"name"), description: optional(data,"description"), category: optional(data,"category"),
      price: text(data,"price") || null, currency: text(data,"currency") || "XOF", billing_unit: optional(data,"billing_unit"),
      conditions: optional(data,"conditions"), inclusions: list(data,"inclusions"), exclusions: list(data,"exclusions"),
      effective_from: optional(data,"effective_from"), expires_at: optional(data,"expires_at"), status: text(data,"status") || "draft",
    };
    else if (kind === "sales") payload = {
      reference: text(data,"reference"), sale_date: text(data,"sale_date"), client_name: optional(data,"client_name"),
      item_label: text(data,"item_label"), quantity: text(data,"quantity") || "1", unit_price: text(data,"unit_price") || "0",
      discount: text(data,"discount") || "0", total_amount: text(data,"total_amount") || null, currency: text(data,"currency") || "XOF",
      payment_method: optional(data,"payment_method"), payment_status: text(data,"payment_status") || "unpaid",
      sales_channel: optional(data,"sales_channel"), comment: optional(data,"comment"), status: text(data,"status") || "draft",
    };
    else payload = {
      title: text(data,"title"), objective: optional(data,"objective"), department: optional(data,"department"), trigger: optional(data,"trigger"),
      expected_result: optional(data,"expected_result"), participants: list(data,"participants"), tools: list(data,"tools"), risks: list(data,"risks"),
      validation_date: optional(data,"validation_date"), next_review_date: optional(data,"next_review_date"), status: text(data,"status") || "draft",
      steps: text(data,"steps").split("\n").map(value=>value.trim()).filter(Boolean).map((title,index)=>({position:index+1,title})),
    };
    try { await serviceIaFetch(`/registers/${kind}${editing ? `/${record!.id}` : ""}`, { method: editing ? "PATCH" : "POST", body:JSON.stringify(payload) }); await onCreated(); onClose(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Enregistrement impossible"); }
    finally { setSaving(false); }
  };
  return <Dialog open={open} onClose={onClose} title={`${editing ? "Modifier" : "Ajouter"} ${labels[kind]}`} description="Les champs marqués * sont obligatoires.">
    <form onSubmit={submit}><div className="app-form-grid">
      {kind === "offers" ? <>
        <label>Nom *<input name="name" required minLength={2} defaultValue={record?.name || ""}/></label><label>Catégorie<input name="category" defaultValue={record?.category || ""}/></label>
        <label>Prix<input name="price" type="number" min="0" step="0.01" defaultValue={record?.price || ""}/></label><label>Devise<input name="currency" defaultValue={record?.currency || "XOF"} minLength={3} maxLength={3}/></label>
        <label>Unité de facturation<input name="billing_unit" placeholder="forfait, heure…" defaultValue={record?.billing_unit || ""}/></label><StatusField value={record?.status}/>
        <label>Date d’effet<input name="effective_from" type="date" defaultValue={record?.effective_from || ""}/></label><label>Date d’expiration<input name="expires_at" type="date" defaultValue={record?.expires_at || ""}/></label>
        <label className="app-form-span">Description<textarea name="description" defaultValue={record?.description || ""}/></label><label className="app-form-span">Conditions<textarea name="conditions" defaultValue={record?.conditions || ""}/></label>
        <label>Inclusions (séparées par virgule)<textarea name="inclusions" defaultValue={(record?.inclusions || []).join(", ")}/></label><label>Exclusions<textarea name="exclusions" defaultValue={(record?.exclusions || []).join(", ")}/></label>
      </> : null}
      {kind === "sales" ? <>
        <label>Référence *<input name="reference" required defaultValue={record?.reference || ""}/></label><label>Date *<input name="sale_date" type="date" defaultValue={record?.sale_date || today()} required/></label>
        <label>Client<input name="client_name" defaultValue={record?.client_name || ""}/></label><label>Offre ou service *<input name="item_label" required defaultValue={record?.item_label || ""}/></label>
        <label>Quantité<input name="quantity" type="number" min="0.01" step="0.01" defaultValue={record?.quantity || "1"}/></label><label>Prix unitaire<input name="unit_price" type="number" min="0" step="0.01" defaultValue={record?.unit_price || "0"}/></label>
        <label>Réduction<input name="discount" type="number" min="0" step="0.01" defaultValue={record?.discount || "0"}/></label><label>Montant total<input name="total_amount" type="number" min="0" step="0.01" defaultValue={record?.total_amount || ""}/></label>
        <label>Devise<input name="currency" defaultValue={record?.currency || "XOF"} minLength={3} maxLength={3}/></label><label>État du paiement<select name="payment_status" defaultValue={record?.payment_status || "unpaid"}><option value="unpaid">Non payé</option><option value="partial">Partiel</option><option value="paid">Payé</option><option value="refunded">Remboursé</option></select></label>
        <label>Mode de paiement<input name="payment_method" defaultValue={record?.payment_method || ""}/></label><label>Canal de vente<input name="sales_channel" defaultValue={record?.sales_channel || ""}/></label><StatusField value={record?.status}/>
        <label className="app-form-span">Commentaire<textarea name="comment" defaultValue={record?.comment || ""}/></label>
      </> : null}
      {kind === "procedures" ? <>
        <label>Titre *<input name="title" required minLength={2} defaultValue={record?.title || ""}/></label><label>Service concerné<input name="department" defaultValue={record?.department || ""}/></label>
        <label className="app-form-span">Objectif<textarea name="objective" defaultValue={record?.objective || ""}/></label><label className="app-form-span">Déclencheur<textarea name="trigger" defaultValue={record?.trigger || ""}/></label>
        <label>Participants<textarea name="participants" defaultValue={(record?.participants || []).join(", ")}/></label><label>Outils<textarea name="tools" defaultValue={(record?.tools || []).join(", ")}/></label><label>Risques<textarea name="risks" defaultValue={(record?.risks || []).join(", ")}/></label><StatusField value={record?.status}/>
        <label>Date de validation<input name="validation_date" type="date" defaultValue={record?.validation_date || ""}/></label><label>Prochaine révision<input name="next_review_date" type="date" defaultValue={record?.next_review_date || ""}/></label>
        <label className="app-form-span">Étapes (une par ligne)<textarea name="steps" defaultValue={(record?.steps || []).map((step: any) => step.title).join("\n")} placeholder={'Recevoir la demande\nVérifier les informations\nConfirmer le traitement'}/></label>
        <label className="app-form-span">Résultat attendu<textarea name="expected_result" defaultValue={record?.expected_result || ""}/></label>
      </> : null}
    </div><FormError>{error}</FormError><div className="app-form-actions"><button type="button" className="app-button app-button-secondary" onClick={onClose}>Annuler</button><button className="app-button app-button-primary" disabled={saving}>{saving?"Enregistrement…":"Enregistrer"}</button></div></form>
  </Dialog>;
}

function StatusField({ value }: { value?: string }){return <label>Statut<select name="status" defaultValue={value || "draft"}><option value="draft">Brouillon</option><option value="to_verify">À vérifier</option><option value="validated">Validé</option><option value="obsolete">Obsolète</option></select></label>}
