"use client";
import { useI18n } from "@/lib/i18n";

import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Building,
  CreditCard,
  User,
  Trash2,
  Pencil,
} from "lucide-react";
import { Dialog, FormError } from "./Dialog";
import { serviceIaFetch } from "@/lib/service-ia/api";

export interface SupplierItem {
  id: string;
  name: string;
  category?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  payment_terms?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface SuppliersTableProps {
  suppliers: SupplierItem[];
  onRefresh: () => void;
}

export function SuppliersDirectory({ suppliers, onRefresh }: SuppliersTableProps) {
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierItem | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return suppliers;
    const q = query.toLowerCase();
    return suppliers.filter((s) =>
      [s.name, s.category, s.contact_name, s.phone, s.email, s.payment_terms].some((v) =>
        String(v || "").toLowerCase().includes(q)
      )
    );
  }, [suppliers, query]);

  return (
    <div className="kx-suppliers-section">
      <div className="app-toolbar">
        <label className="app-search kx-search-box">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un fournisseur par nom, contact, téléphone, catégorie…"
          />
        </label>

        <button
          type="button"
          className="app-button app-button-primary"
          onClick={() => setCreating(true)}
        >
          <Plus size={16} />
          <span>Ajouter un Fournisseur</span>
        </button>
      </div>

      <div className="kx-suppliers-grid">
        {filtered.map((sup) => (
          <article key={sup.id} className="kx-supplier-card">
            <div className="kx-supplier-head">
              <div className="kx-supplier-icon">
                <Building size={20} />
              </div>
              <div className="kx-supplier-title">
                <h3>{sup.name}</h3>
                <span className="kx-supplier-cat">{sup.category || "Fournisseur Général"}</span>
              </div>
            </div>

            <div className="kx-supplier-details">
              {sup.contact_name && (
                <div className="kx-supplier-row">
                  <User size={14} />
                  <span>Contact : {sup.contact_name}</span>
                </div>
              )}
              {sup.phone && (
                <div className="kx-supplier-row">
                  <Phone size={14} />
                  <a href={`tel:${sup.phone}`}>{sup.phone}</a>
                </div>
              )}
              {sup.email && (
                <div className="kx-supplier-row">
                  <Mail size={14} />
                  <a href={`mailto:${sup.email}`}>{sup.email}</a>
                </div>
              )}
              {sup.address && (
                <div className="kx-supplier-row">
                  <MapPin size={14} />
                  <span>{sup.address}</span>
                </div>
              )}
              <div className="kx-supplier-row kx-terms-row">
                <CreditCard size={14} />
                <span>Modalité : {sup.payment_terms || "Comptant"}</span>
              </div>
            </div>
            <div className="app-form-actions">
              <button type="button" className="app-button app-button-secondary" onClick={() => setSelectedSupplier(sup)}><Pencil size={15}/>Modifier</button>
              <button type="button" className="app-button app-button-secondary" onClick={async () => { if (!window.confirm(`Supprimer définitivement ${sup.name} ?`)) return; await serviceIaFetch(`/registers/suppliers/${sup.id}`, { method: "DELETE" }); await onRefresh(); }}><Trash2 size={15}/>Supprimer</button>
            </div>
          </article>
        ))}

        {filtered.length === 0 && (
          <div className="kx-empty-box kx-compact">
            <Building size={32} />
            <strong>Aucun fournisseur trouvé</strong>
            <p>Ajoutez vos partenaires réguliers pour simplifier la saisie de vos dépenses.</p>
          </div>
        )}
      </div>

      <SupplierCreateDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={onRefresh}
      />
      <SupplierCreateDialog
        key={selectedSupplier?.id || "no-supplier-edit"}
        open={Boolean(selectedSupplier)}
        supplier={selectedSupplier}
        onClose={() => setSelectedSupplier(null)}
        onCreated={onRefresh}
      />
    </div>
  );
}

function SupplierCreateDialog({
  open,
  onClose,
  onCreated,
  supplier,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  supplier?: SupplierItem | null;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const payload = {
        name: String(form.get("name") || ""),
        category: String(form.get("category") || "Général"),
        contact_name: String(form.get("contact_name") || "") || null,
        phone: String(form.get("phone") || "") || null,
        email: String(form.get("email") || "") || null,
        address: String(form.get("address") || "") || null,
        payment_terms: String(form.get("payment_terms") || "Comptant") || null,
      };

      await serviceIaFetch(`/registers/suppliers${supplier ? `/${supplier.id}` : ""}`, {
        method: supplier ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'ajout du fournisseur");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog
      open
      title={supplier ? `Modifier ${supplier.name}` : "Nouveau Fournisseur"}
      description="Enregistrez les coordonnées et conditions commerciales d'un fournisseur."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <div className="app-form-grid">
          <label className="app-form-span">
            Nom de l&apos;entreprise ou du fournisseur *
            <input name="name" required placeholder="Ex : Matériaux & Ciment SA" defaultValue={supplier?.name || ""}/>
          </label>

          <label>
            Catégorie d&apos;activité
            <input name="category" placeholder="Ex : Matières premières, Informatique…" defaultValue={supplier?.category || ""}/>
          </label>

          <label>
            Nom du contact
            <input name="contact_name" placeholder="Ex : M. Diallo" defaultValue={supplier?.contact_name || ""}/>
          </label>

          <label>
            Numéro de téléphone
            <input name="phone" placeholder="Ex : +225 07 00 00 00" defaultValue={supplier?.phone || ""}/>
          </label>

          <label>
            Adresse e-mail
            <input name="email" type="email" placeholder="contact@fournisseur.com" defaultValue={supplier?.email || ""}/>
          </label>

          <label className="app-form-span">
            Modalités de règlement habituelles
            <select name="payment_terms" defaultValue={supplier?.payment_terms || "Comptant"}>
              <option value="Comptant">Paiement comptant / Immédiat</option>
              <option value="30 jours">30 jours fin de mois</option>
              <option value="Acompte 50%">Acompte 50% à la commande</option>
              <option value="Autre">Sur devis / Autre</option>
            </select>
          </label>

          <label className="app-form-span">
            Adresse physique
            <textarea name="address" placeholder="Localisation, ville, quartier…" defaultValue={supplier?.address || ""}/>
          </label>
        </div>

        <FormError>{error}</FormError>

        <div className="app-form-actions">
          <button type="button" className="app-button app-button-secondary" onClick={onClose}>
            Annuler
          </button>
          <button className="app-button app-button-primary" disabled={saving}>
            {saving ? "Enregistrement…" : supplier ? "Enregistrer les modifications" : "Enregistrer le fournisseur"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
