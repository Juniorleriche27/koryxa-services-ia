"use client";
import { useI18n } from "@/lib/i18n";

import React from "react";
import { PageHeader } from "../PageHeader";
import { EmptyState } from "../Ui";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { BusinessCategorySettings } from "../BusinessCategorySettings";
import { AutomationsHubView } from "../AutomationsHubView";
import { ShieldCheck, AlertTriangle } from "lucide-react";

export type RadarRule = {
  id: string;
  rule_code: string;
  enabled: boolean;
  priority: string;
  parameters: Record<string, unknown>;
};

const RULE_METADATA: Record<string, { label: string; description: string }> = {
  MARGIN_NEGATIVE: {
    label: "Surveillance des Marges Négatives",
    description: "Alerte immédiate lorsqu'un produit ou service est vendu en dessous de son prix de revient.",
  },
  STOCK_OUT_RISK: {
    label: "Alerte de Rupture de Stock",
    description: "Détecte les articles dont le stock passe en dessous du seuil de sécurité.",
  },
  OVERDUE_PAYMENT: {
    label: "Détection des Retards de Paiement",
    description: "Identifie automatiquement les factures impayées dont l'échéance de règlement est dépassée.",
  },
  ANOMALOUS_EXPENSE: {
    label: "Surveillance des Dépenses Inhabituelles",
    description: "Signale les sorties de caisse anormalement élevées ou non catégorisées.",
  },
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
      <BusinessCategorySettings />
      <AutomationsHubView />

      <PageHeader
        eyebrow="Contrôle & Qualité"
        title="Règles de Sentinelle Radar"
        description="Activez les contrôles automatisés pour protéger vos marges, votre trésorerie et vos stocks."
      />

      {loading && <EmptyState title="Chargement…" detail="Récupération des règles Radar." />}
      {error && <EmptyState title="Données indisponibles" detail={error} />}

      {rules && rules.length > 0 && (
        <section className="app-panel">
          <div className="app-list">
            {rules.map((r) => {
              const meta = RULE_METADATA[r.rule_code] || {
                label: r.rule_code.replace(/_/g, " "),
                description: "Contrôle automatique de conformité des opérations.",
              };

              return (
                <article className="app-list-row items-center justify-between" key={r.id}>
                  <div className="app-list-main">
                    <strong className="text-foreground text-sm">{meta.label}</strong>
                    <span className="text-xs text-muted-foreground">{meta.description}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={r.priority}
                      onChange={(event) => void updateRule(r, { priority: event.target.value })}
                      aria-label={`Priorité de ${meta.label}`}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-border bg-background"
                    >
                      <option value="low">Priorité Faible</option>
                      <option value="normal">Priorité Normale</option>
                      <option value="high">Priorité Haute</option>
                      <option value="critical">Priorité Critique</option>
                    </select>
                    <button
                      className={`app-button text-xs ${r.enabled ? "app-button-secondary" : "app-button-primary"}`}
                      onClick={() => void updateRule(r, { enabled: !r.enabled })}
                    >
                      {r.enabled ? "Désactiver" : "Activer"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
