"use client";

import React, { useState } from "react";
import { Check, X } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { EmptyState, StatusPill } from "../Ui";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { formatLabel } from "../RegistersTable";

export type ValidationItem = {
  id: string;
  field_name: string;
  old_value: unknown;
  proposed_value: unknown;
  source_type: string;
  confidence: number;
  status: string;
};

export function ValidationsSection({
  data,
  loading,
  error,
  onReload,
}: {
  data: ValidationItem[] | null;
  loading: boolean;
  error: string;
  onReload: () => Promise<void>;
}) {
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const decide = async (id: string, decision: "accepted" | "rejected") => {
    setDecidingId(id);
    try {
      await serviceIaFetch(`/workflow/validations/${id}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision, justification: "Décision depuis l’espace Service IA" }),
      });
      await onReload();
    } finally {
      setDecidingId(null);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Contrôle humain"
        title="Validations"
        description="Propositions et corrections automatiques en attente de décision humaine."
      />

      {loading && <EmptyState title="Chargement…" detail="Récupération des validations en attente." />}
      {error && <EmptyState title="Données indisponibles" detail={error} />}
      {!loading && !error && (!data || data.length === 0) && (
        <EmptyState
          title="Toutes les données sont validées"
          detail="Aucune proposition ou correction n'est en attente pour le moment."
        />
      )}

      {data && data.length > 0 && (
        <section className="app-panel">
          <div className="app-validation-list">
            {data.map((v) => (
              <article className="app-validation" key={v.id}>
                <div className="app-validation-head">
                  <div>
                    <strong>{v.field_name}</strong>
                    <span>Source : {formatLabel(v.source_type)}</span>
                  </div>
                  <StatusPill>{Math.round(v.confidence * 100)}% de confiance</StatusPill>
                </div>
                <div className="app-change">
                  <div>
                    <small>Valeur actuelle</small>
                    <strong>{formatLabel(v.old_value)}</strong>
                  </div>
                  <span>→</span>
                  <div>
                    <small>Valeur proposée</small>
                    <strong>{formatLabel(v.proposed_value)}</strong>
                  </div>
                </div>
                <div className="app-validation-actions">
                  <button
                    className="app-button app-button-secondary"
                    disabled={decidingId === v.id}
                    onClick={() => void decide(v.id, "rejected")}
                  >
                    <X size={15} />
                    <span>Rejeter</span>
                  </button>
                  <button
                    className="app-button app-button-primary"
                    disabled={decidingId === v.id}
                    onClick={() => void decide(v.id, "accepted")}
                  >
                    <Check size={15} />
                    <span>Accepter</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
