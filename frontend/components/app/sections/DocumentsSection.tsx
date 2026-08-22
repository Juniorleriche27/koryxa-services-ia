"use client";
import { useI18n } from "@/lib/i18n";

import React, { useState } from "react";
import { FileText } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { EmptyState, StatusPill } from "../Ui";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { formatDate } from "../RegistersTable";
import { directUpload, prepareDocumentUpload } from "@/lib/files/directUpload";

export type AttachmentItem = {
  id: string;
  filename: string;
  register_type: string;
  record_id: string;
  size_bytes: number;
  created_at: string;
};

export function DocumentsSection() {
  const { t } = useI18n();
  const [registerType, setRegisterType] = useState("offers");
  const [recordId, setRecordId] = useState("");
  const [items, setItems] = useState<AttachmentItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!recordId.trim()) return;
    setLoading(true);
    setError("");
    try {
      setItems(
        await serviceIaFetch(
          `/imports/attachments?register_type=${encodeURIComponent(
            registerType
          )}&record_id=${encodeURIComponent(recordId.trim())}`
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Documents indisponibles");
    } finally {
      setLoading(false);
    }
  };

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const source = event.target.files?.[0];
    if (!source || !recordId.trim()) return;
    setLoading(true);
    setError("");
    try {
      const file = await prepareDocumentUpload(source);
      await directUpload("attachment", registerType, file, recordId.trim());
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ajout impossible");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Mémoire documentaire"
        title="Documents & Justificatifs"
        description="Consultez et rattachez des fichiers justificatifs aux registres opérationnels."
      />
      <section className="app-panel">
        <div className="app-toolbar">
          <select value={registerType} onChange={(e) => setRegisterType(e.target.value)}>
            <option value="offers">Offres & Tarifs</option>
            <option value="sales">Ventes & Factures</option>
            <option value="depenses">Dépenses & Reçus</option>
            <option value="procedures">Procédures & SOP</option>
          </select>
          <input
            value={recordId}
            onChange={(e) => setRecordId(e.target.value)}
            placeholder="Identifiant ou référence de l'élément"
          />
          <button className="app-button app-button-secondary" onClick={() => void load()}>
            Charger
          </button>
          <label className={`app-button app-button-primary ${!recordId.trim() ? "opacity-50 pointer-events-none" : ""}`}>
            Ajouter un justificatif
            <input
              className="sr-only"
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.png,.jpg,.jpeg,.webp,.zip"
              onChange={upload}
              disabled={!recordId.trim()}
            />
          </label>
        </div>
        <p className="app-panel-note">
          PDF, Word, Excel, Images (JPEG/PNG), ZIP jusqu&apos;à 100 Mo.
        </p>

        {loading && <EmptyState title="Chargement…" detail="Recherche des justificatifs." />}
        {error && <EmptyState title="Données indisponibles" detail={error} />}
        {!loading && !error && items.length === 0 && (
          <EmptyState
            title="Aucun document rattaché"
            detail="Entrez une référence ou un identifiant pour consulter ou ajouter des documents."
          />
        )}

        {items.length > 0 && (
          <div className="app-list">
            {items.map((d) => (
              <article className="app-list-row" key={d.id}>
                <div className="app-list-icon">
                  <FileText size={19} />
                </div>
                <div className="app-list-main">
                  <strong>{d.filename}</strong>
                  <span>
                    {d.register_type} ·{" "}
                    {d.size_bytes >= 1048576
                      ? `${(d.size_bytes / 1048576).toFixed(1)} Mo`
                      : `${Math.ceil(d.size_bytes / 1024)} Ko`}
                  </span>
                </div>
                <StatusPill>{formatDate(d.created_at)}</StatusPill>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
