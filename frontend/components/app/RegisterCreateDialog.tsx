"use client";

import { useState } from "react";
import { Dialog, FormError } from "./Dialog";
import { serviceIaFetch } from "@/lib/service-ia/api";

type Kind = "offers" | "sales" | "procedures";
const today = () => new Date().toISOString().slice(0, 10);
const text = (data: FormData, key: string) => String(data.get(key) || "").trim();
const optional = (data: FormData, key: string) => text(data, key) || null;
const list = (data: FormData, key: string) => text(data, key).split(/[,\n]/).map(value => value.trim()).filter(Boolean);

export function RegisterCreateDialog({ kind, open, onClose, onCreated }: { kind: Kind; open: boolean; onClose: () => void; onCreated: () => Promise<void> | void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const labels = { offers: "une offre", sales: "une vente", procedures: "une procédure" };
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
    try { await serviceIaFetch(`/registers/${kind}`, { method:"POST", body:JSON.stringify(payload) }); await onCreated(); onClose(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Enregistrement impossible"); }
    finally { setSaving(false); }
  };
  return <Dialog open={open} onClose={onClose} title={`Ajouter ${labels[kind]}`} description="Les champs marqués * sont obligatoires.">
    <form onSubmit={submit}><div className="app-form-grid">
      {kind === "offers" ? <>
        <label>Nom *<input name="name" required minLength={2}/></label><label>Catégorie<input name="category"/></label>
        <label>Prix<input name="price" type="number" min="0" step="0.01"/></label><label>Devise<input name="currency" defaultValue="XOF" minLength={3} maxLength={3}/></label>
        <label>Unité de facturation<input name="billing_unit" placeholder="forfait, heure…"/></label><StatusField/>
        <label>Date d’effet<input name="effective_from" type="date"/></label><label>Date d’expiration<input name="expires_at" type="date"/></label>
        <label className="app-form-span">Description<textarea name="description"/></label><label className="app-form-span">Conditions<textarea name="conditions"/></label>
        <label>Inclusions (séparées par virgule)<textarea name="inclusions"/></label><label>Exclusions<textarea name="exclusions"/></label>
      </> : null}
      {kind === "sales" ? <>
        <label>Référence *<input name="reference" required/></label><label>Date *<input name="sale_date" type="date" defaultValue={today()} required/></label>
        <label>Client<input name="client_name"/></label><label>Offre ou service *<input name="item_label" required/></label>
        <label>Quantité<input name="quantity" type="number" min="0.01" step="0.01" defaultValue="1"/></label><label>Prix unitaire<input name="unit_price" type="number" min="0" step="0.01" defaultValue="0"/></label>
        <label>Réduction<input name="discount" type="number" min="0" step="0.01" defaultValue="0"/></label><label>Montant total<input name="total_amount" type="number" min="0" step="0.01"/></label>
        <label>Devise<input name="currency" defaultValue="XOF" minLength={3} maxLength={3}/></label><label>État du paiement<select name="payment_status"><option value="unpaid">Non payé</option><option value="partial">Partiel</option><option value="paid">Payé</option><option value="refunded">Remboursé</option></select></label>
        <label>Mode de paiement<input name="payment_method"/></label><label>Canal de vente<input name="sales_channel"/></label><StatusField/>
        <label className="app-form-span">Commentaire<textarea name="comment"/></label>
      </> : null}
      {kind === "procedures" ? <>
        <label>Titre *<input name="title" required minLength={2}/></label><label>Service concerné<input name="department"/></label>
        <label className="app-form-span">Objectif<textarea name="objective"/></label><label className="app-form-span">Déclencheur<textarea name="trigger"/></label>
        <label>Participants<textarea name="participants"/></label><label>Outils<textarea name="tools"/></label><label>Risques<textarea name="risks"/></label><StatusField/>
        <label>Date de validation<input name="validation_date" type="date"/></label><label>Prochaine révision<input name="next_review_date" type="date"/></label>
        <label className="app-form-span">Étapes (une par ligne)<textarea name="steps" placeholder={'Recevoir la demande\nVérifier les informations\nConfirmer le traitement'}/></label>
        <label className="app-form-span">Résultat attendu<textarea name="expected_result"/></label>
      </> : null}
    </div><FormError>{error}</FormError><div className="app-form-actions"><button type="button" className="app-button app-button-secondary" onClick={onClose}>Annuler</button><button className="app-button app-button-primary" disabled={saving}>{saving?"Enregistrement…":"Enregistrer"}</button></div></form>
  </Dialog>;
}

function StatusField(){return <label>Statut<select name="status"><option value="draft">Brouillon</option><option value="to_verify">À vérifier</option><option value="validated">Validé</option></select></label>}
