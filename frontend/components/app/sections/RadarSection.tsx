"use client";

import React, { useState } from "react";
import { Play, Radar as RadarIcon } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { EmptyState, StatusPill } from "../Ui";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { formatLabel } from "../RegistersTable";

export type AlertItem = {
  id: string;
  title: string;
  explanation: string;
  priority: string;
  dimension: string;
  status: string;
  confidence: number;
};

export function RadarSection({
  data,
  loading,
  error,
  onReload,
}: {
  data: AlertItem[] | null;
  loading: boolean;
  error: string;
  onReload: () => Promise<void>;
}) {
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    try {
      await serviceIaFetch("/radar/runs", { method: "POST" });
      await onReload();
    } finally {
      setRunning(false);
    }
  };

  const update = async (id: string, status: string) => {
    await serviceIaFetch(`/radar/alerts/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await onReload();
  };

  const createActionFromAlert = async (a: AlertItem) => {
    await serviceIaFetch("/workflow/actions", {
      method: "POST",
      body: JSON.stringify({
        alert_id: a.id,
        title: a.title,
        description: a.explanation,
        priority: a.priority,
      }),
    });
    await update(a.id, "acknowledged");
  };

  return (
    <>
      <PageHeader
        eyebrow="Audit Automatique"
        title="Radar des Anomalies"
        description="Contrôleur de gestion virtuel : détecte automatiquement les erreurs de calcul, les impayés oubliés et les données incomplètes."
        action={
          <button className="app-button app-button-primary" disabled={running} onClick={run}>
            <Play size={16} />
            <span>{running ? "Analyse en cours…" : "Relancer l'audit Radar"}</span>
          </button>
        }
      />

      {loading && <EmptyState title="Chargement…" detail="Récupération des alertes Radar." />}
      {error && <EmptyState title="Données indisponibles" detail={error} />}
      {!loading && !error && (!data || data.length === 0) && (
        <EmptyState
          title="Aucune anomalie détectée"
          detail="Le Radar n’a identifié aucune contradiction ou donnée manquante."
        />
      )}

      {data && data.length > 0 && (
        <section className="app-panel">
          <div className="app-alert-list">
            {data.map((a) => (
              <article className="app-alert app-alert-large" key={a.id}>
                <RadarIcon size={18} />
                <div>
                  <strong>{a.title}</strong>
                  <p>{a.explanation}</p>
                  <div className="app-alert-tags">
                    <span>{formatLabel(a.dimension)}</span>
                    <span>{formatLabel(a.status)}</span>
                  </div>
                </div>
                <StatusPill>{formatLabel(a.priority)}</StatusPill>
                <div className="app-row-actions">
                  {a.status !== "resolved" && (
                    <button
                      className="app-button app-button-secondary"
                      onClick={() => void createActionFromAlert(a)}
                    >
                      Créer une action
                    </button>
                  )}
                  {a.status !== "resolved" && (
                    <button
                      className="app-text-button"
                      onClick={() => void update(a.id, "resolved")}
                    >
                      Résoudre
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
