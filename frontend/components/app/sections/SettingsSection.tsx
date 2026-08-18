"use client";

import React from "react";
import { PageHeader } from "../PageHeader";
import { EmptyState } from "../Ui";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { AIProviderSettings } from "../AIProviderSettings";

export type RadarRule = {
  id: string;
  rule_code: string;
  enabled: boolean;
  priority: string;
  parameters: Record<string, unknown>;
};

export function SettingsSection({
  rules,
  loading,
  error,
  onReload,
}: {
  rules: RadarRule[] | null;
  loading: boolean;
  error: string;
  onReload: () => Promise<void>;
}) {
  const updateRule = async (rule: RadarRule, patch: Record<string, unknown>) => {
    await serviceIaFetch(`/radar/rules/${rule.rule_code}`, {
      method: "PUT",
      body: JSON.stringify({
        enabled: rule.enabled,
        priority: rule.priority,
        parameters: rule.parameters,
        ...patch,
      }),
    });
    await onReload();
  };

  return (
    <>
      <AIProviderSettings />

      <PageHeader
        eyebrow="Contrôle & Qualité"
        title="Règles de Sentinelle Radar"
        description="Activez les règles de détection automatique et ajustez leur niveau de priorité."
      />

      {loading && <EmptyState title="Chargement…" detail="Récupération des règles Radar." />}
      {error && <EmptyState title="Données indisponibles" detail={error} />}

      {rules && rules.length > 0 && (
        <section className="app-panel">
          <div className="app-list">
            {rules.map((r) => (
              <article className="app-list-row" key={r.id}>
                <div className="app-list-main">
                  <strong>{r.rule_code}</strong>
                  <span>{Object.keys(r.parameters || {}).length} paramètres configurés</span>
                </div>
                <select
                  value={r.priority}
                  onChange={(event) => void updateRule(r, { priority: event.target.value })}
                  aria-label={`Priorité de ${r.rule_code}`}
                >
                  <option value="low">Faible</option>
                  <option value="normal">Normale</option>
                  <option value="high">Haute</option>
                  <option value="critical">Critique</option>
                </select>
                <button
                  className={`app-button ${r.enabled ? "app-button-secondary" : "app-button-primary"}`}
                  onClick={() => void updateRule(r, { enabled: !r.enabled })}
                >
                  {r.enabled ? "Désactiver" : "Activer"}
                </button>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
