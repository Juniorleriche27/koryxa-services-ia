"use client";

import React, { useState } from "react";
import { Download, UploadCloud, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { FormError } from "../Dialog";
import { StatusPill } from "../Ui";
import { directUpload } from "@/lib/files/directUpload";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { useI18n } from "@/lib/i18n";

type RegisterKey = "offers" | "sales" | "depenses" | "fournisseurs" | "procedures";

interface ImportPreviewData {
  id: string;
  register_type: string;
  filename: string;
  status: string;
  detected_headers: string[];
  suggested_mapping: Record<string, string>;
  preview_rows: Record<string, unknown>[];
  errors: Array<{ row: number; message: string }>;
  duplicate_rows: number[];
  row_count: number;
}

const REGISTER_TARGET_FIELDS: Record<
  RegisterKey,
  Array<{ key: string; label: string; required?: boolean }>
> = {
  offers: [
    { key: "name", label: "Nom de l'offre", required: true },
    { key: "price", label: "Tarif / Prix" },
    { key: "currency", label: "Devise (XOF, EUR...)" },
    { key: "category", label: "Catégorie" },
  ],
  sales: [
    { key: "reference", label: "Référence Facture / Vente", required: true },
    { key: "sale_date", label: "Date de vente (AAAA-MM-JJ)", required: true },
    { key: "item_label", label: "Désignation Produit / Service", required: true },
    { key: "client_name", label: "Nom du Client" },
    { key: "quantity", label: "Quantité" },
    { key: "unit_price", label: "Prix Unitaire" },
    { key: "discount", label: "Remise" },
    { key: "payment_method", label: "Mode de règlement (Wave, Espèces...)" },
    { key: "payment_status", label: "Statut (payé, non payé...)" },
  ],
  depenses: [
    { key: "reference", label: "Référence Reçu / Facture", required: true },
    { key: "expense_date", label: "Date de dépense", required: true },
    { key: "label", label: "Motif / Désignation", required: true },
    { key: "amount", label: "Montant total", required: true },
    { key: "category", label: "Catégorie de charge" },
    { key: "supplier_name", label: "Nom du Fournisseur" },
    { key: "payment_status", label: "Statut de règlement" },
  ],
  fournisseurs: [
    { key: "name", label: "Nom du fournisseur", required: true },
    { key: "category", label: "Catégorie d'activité" },
    { key: "contact_name", label: "Nom du contact" },
    { key: "phone", label: "Téléphone" },
    { key: "email", label: "Adresse e-mail" },
  ],
  procedures: [
    { key: "title", label: "Titre de la procédure", required: true },
    { key: "objective", label: "Objectif visé" },
    { key: "department", label: "Département / Service" },
    { key: "responsible_user_id", label: "Responsable" },
  ],
};

export function ImportsSection() {
  const { t } = useI18n();
  const [registerType, setRegisterType] = useState<RegisterKey>("sales");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewData | null>(null);
  const [customMapping, setCustomMapping] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSelectFile = (selected: File | null) => {
    setError("");
    setSuccessMessage("");
    if (selected && selected.size > 100 * 1024 * 1024) {
      setFile(null);
      setError("Le fichier ne doit pas dépasser 100 Mo.");
      return;
    }
    setFile(selected);
    setPreview(null);
  };

  const handlePreviewUpload = async () => {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      const result = (await directUpload("import", registerType, file)) as ImportPreviewData;
      setPreview(result);
      setCustomMapping(result.suggested_mapping || {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'analyse du fichier.");
    } finally {
      setBusy(false);
    }
  };

  const handleMappingChange = (header: string, targetField: string) => {
    setCustomMapping((prev) => {
      const next = { ...prev };
      if (!targetField) {
        delete next[header];
      } else {
        next[header] = targetField;
      }
      return next;
    });
  };

  const handleConfirmImport = async () => {
    if (!preview) return;
    setBusy(true);
    setError("");
    setSuccessMessage("");
    try {
      await serviceIaFetch(`/imports/${preview.id}/confirm`, {
        method: "POST",
        body: JSON.stringify({ column_mapping: customMapping }),
      });
      setSuccessMessage(
        `✅ Importation réussie : ${preview.row_count} ligne(s) ont été intégrées et comptabilisées avec succès dans votre registre.`
      );
      window.dispatchEvent(new CustomEvent("koryxa:record-created"));
      setPreview(null);
      setFile(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la confirmation de l'import.");
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = () => {
    window.location.href = `/api/service-ia/imports/export/${registerType}`;
  };

  const availableFields = REGISTER_TARGET_FIELDS[registerType] || [];
  const mappedTargets = new Set(Object.values(customMapping));
  const missingRequired = availableFields
    .filter((f) => f.required && !mappedTargets.has(f.key))
    .map((f) => f.label);

  return (
    <>
      <PageHeader
        eyebrow={t("imports_eyebrow")}
        title={t("imports_title")}
        description={t("imports_desc")}
        action={
          <button className="app-button app-button-secondary" onClick={exportCsv}>
            <Download size={16} />
            <span>Exporter le modèle CSV</span>
          </button>
        }
      />

      <section className="app-panel app-upload">
        <label>
          Registre de destination
          <select
            value={registerType}
            onChange={(e) => {
              setRegisterType(e.target.value as RegisterKey);
              setPreview(null);
              setSuccessMessage("");
            }}
          >
            <option value="sales">Ventes & Factures</option>
            <option value="depenses">Dépenses & Achats</option>
            <option value="offers">Offres & Tarifs</option>
            <option value="fournisseurs">Fournisseurs</option>
            <option value="procedures">Procédures & SOP</option>
          </select>
        </label>

        {!preview && (
          <label className="app-dropzone">
            <input
              type="file"
              accept=".csv,.tsv,.xlsx,.json"
              onChange={(e) => handleSelectFile(e.target.files?.[0] ?? null)}
            />
            <UploadCloud size={34} />
            <strong>{file ? file.name : "Glissez votre fichier Excel ou CSV ici"}</strong>
            <span>Formats acceptés : CSV, TSV, XLSX ou JSON (max 100 Mo)</span>
          </label>
        )}

        <FormError>{error}</FormError>

        {successMessage && (
          <div className="kx-success-alert" style={{ margin: "14px 0" }}>
            <CheckCircle2 size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {file && !preview && (
          <div className="app-form-actions" style={{ marginTop: 16 }}>
            <button
              className="app-button app-button-primary"
              disabled={busy}
              onClick={handlePreviewUpload}
            >
              {busy ? "Analyse du fichier…" : "Analyser les colonnes"}
            </button>
          </div>
        )}

        {preview && (
          <div className="app-import-preview" style={{ marginTop: 20 }}>
            <div className="app-panel-head">
              <div>
                <h2>{preview.row_count} lignes détectées</h2>
                <p className="app-panel-note">
                  Fichier : <strong>{preview.filename}</strong> · Vérifiez et ajustez la correspondance des colonnes.
                </p>
              </div>
              <StatusPill>{preview.detected_headers.length} colonnes</StatusPill>
            </div>

            {/* Column Mapping Grid */}
            <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
              <h3>Correspondance des colonnes</h3>
              {preview.detected_headers.map((header) => {
                const currentMapped = customMapping[header] || "";
                const sampleValue = preview.preview_rows[0]?.[header];
                return (
                  <div
                    key={header}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto 1fr",
                      alignItems: "center",
                      gap: 12,
                      background: "var(--kx-surface-muted, #f8fafc)",
                      padding: "8px 14px",
                      borderRadius: 8,
                    }}
                  >
                    <div>
                      <strong>{header}</strong>
                      {sampleValue !== undefined && (
                        <div style={{ fontSize: "0.8rem", color: "var(--kx-text-muted, #64748b)" }}>
                          Ex : {String(sampleValue).slice(0, 35)}
                        </div>
                      )}
                    </div>
                    <ArrowRight size={16} style={{ color: "var(--kx-text-muted, #94a3b8)" }} />
                    <select
                      value={currentMapped}
                      onChange={(e) => handleMappingChange(header, e.target.value)}
                      aria-label={`Champ cible pour ${header}`}
                    >
                      <option value="">-- Ne pas importer --</option>
                      {availableFields.map((f) => (
                        <option key={f.key} value={f.key}>
                          {f.label} {f.required ? "(*)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>

            {missingRequired.length > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 16,
                  color: "#b45309",
                  background: "#fef3c7",
                  padding: "10px 14px",
                  borderRadius: 8,
                }}
              >
                <AlertTriangle size={18} />
                <span>Champs obligatoires non associés : {missingRequired.join(", ")}</span>
              </div>
            )}

            <div className="app-form-actions" style={{ marginTop: 24 }}>
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={() => setPreview(null)}
              >
                Annuler
              </button>
              <button
                className="app-button app-button-primary"
                disabled={busy || missingRequired.length > 0}
                onClick={handleConfirmImport}
              >
                {busy ? "Importation en cours…" : "Confirmer et importer"}
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
