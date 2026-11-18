"use client";
import { useI18n } from "@/lib/i18n";

import React from "react";
import { EmptyState } from "../Ui";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { BusinessCategorySettings } from "../BusinessCategorySettings";
import { AutomationsHubView } from "../AutomationsHubView";
import Link from "next/link";
import { ShieldCheck, AlertTriangle, CreditCard, ArrowRight } from "lucide-react";

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
  const { t } = useI18n();
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
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between pb-4 border-b border-emerald-950/10">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
            Direction · Paramètres
          </span>
          <h1 className="mt-1 font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-semibold tracking-tight text-slate-950">
            Réglages et contrôles
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Configurez les règles de surveillance et les options de votre organisation.
          </p>
        </div>
        <Link
          href="/espace/parametres/facturation"
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-xs font-bold text-emerald-800 shadow-2xs transition hover:bg-emerald-50 shrink-0"
        >
          <CreditCard size={14} />
          <span>Gérer l&apos;abonnement</span>
          <ArrowRight size={14} />
        </Link>
      </header>

      <BusinessCategorySettings />
      <AutomationsHubView />

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
    </div>
  );
}
