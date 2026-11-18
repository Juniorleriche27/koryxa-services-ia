"use client";

import React, { useState } from "react";
import { FileText, Search, Upload } from "lucide-react";
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
  const [registerType, setRegisterType] = useState("sales");
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
    <div className="flex flex-col gap-5">
      {/* EN-TÊTE DIRECT ET COHÉRENT */}
      <header className="pb-4 border-b border-emerald-950/10">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
          Direction · Documents
        </span>
        <h1 className="mt-1 font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-semibold tracking-tight text-slate-950">
          Documents et justificatifs
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Retrouvez vos pièces jointes et rattachez vos justificatifs officiels à chaque dossier.
        </p>
      </header>

      {/* PANNEAU DE RECHERCHE ET AJOUT CLAIR */}
      <section
        className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4"
        aria-label="Recherche et gestion des justificatifs"
      >
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <label className="sm:col-span-3 flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
            <span>Catégorie</span>
            <select
              value={registerType}
              onChange={(e) => setRegisterType(e.target.value)}
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            >
              <option value="sales">Ventes & Factures</option>
              <option value="depenses">Dépenses & Reçus</option>
              <option value="offers">Offres & Tarifs</option>
              <option value="procedures">Procédures & SOP</option>
            </select>
          </label>

          <label className="sm:col-span-5 flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
            <span>Référence du dossier</span>
            <input
              value={recordId}
              onChange={(e) => setRecordId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void load();
              }}
              placeholder="Ex : VOC-20260921-9F63 ou REC-2026-004"
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </label>

          <div className="sm:col-span-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              disabled={!recordId.trim() || loading}
              className="flex-1 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
            >
              <Search size={15} />
              Rechercher
            </button>

            <label
              className={`flex-1 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-emerald-800 px-3.5 text-xs font-bold text-white shadow-2xs transition hover:bg-emerald-900 cursor-pointer ${
                !recordId.trim() ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <Upload size={15} />
              Ajouter
              <input
                className="sr-only"
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.png,.jpg,.jpeg,.webp,.zip"
                onChange={upload}
                disabled={!recordId.trim()}
              />
            </label>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Formats acceptés : PDF, Word, Excel, Images (JPEG/PNG) et ZIP jusqu&apos;à 100 Mo.
        </p>

        {loading && <EmptyState title="Chargement…" detail="Recherche des justificatifs." />}
        {error && <EmptyState title="Données indisponibles" detail={error} />}
        {!loading && !error && items.length === 0 && (
          <EmptyState
            title="Aucun document affiché"
            detail="Sélectionnez une catégorie puis entrez la référence d'une vente, facture ou dépense pour voir ou joindre ses justificatifs."
          />
        )}

        {items.length > 0 && (
          <div className="flex flex-col gap-2.5 pt-2">
            {items.map((d) => (
              <article
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 transition hover:bg-white hover:border-emerald-200"
                key={d.id}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0">
                    <strong className="block truncate text-sm font-bold text-slate-900">
                      {d.filename}
                    </strong>
                    <span className="text-xs text-slate-500">
                      {d.register_type} ·{" "}
                      {d.size_bytes >= 1048576
                        ? `${(d.size_bytes / 1048576).toFixed(1)} Mo`
                        : `${Math.ceil(d.size_bytes / 1024)} Ko`}
                    </span>
                  </div>
                </div>
                <StatusPill>{formatDate(d.created_at)}</StatusPill>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
