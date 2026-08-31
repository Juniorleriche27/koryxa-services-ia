"use client";
import { useI18n } from "@/lib/i18n";

import React from "react";
import { PageHeader } from "../PageHeader";
import { EmptyState } from "../Ui";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { BusinessCategorySettings } from "../BusinessCategorySettings";
import { AutomationsHubView } from "../AutomationsHubView";
import Link from "next/link";
import { ShieldCheck, AlertTriangle, CreditCard, ArrowRight, Sparkles } from "lucide-react";

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
    <>
      {/* Banner Formule & Facturation */}
      <div className="mb-6 rounded-3xl border-2 border-emerald-500/40 bg-linear-to-r from-emerald-950 via-teal-950 to-slate-950 p-6 text-white shadow-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-300">
              <Sparkles size={14} />
              Formules & Facturation KORYXA
            </div>
            <h3 className="text-lg font-extrabold text-white">Offre Spéciale Lancement · Pack 3 Mois</h3>
            <p className="text-xs text-slate-300 max-w-xl">
              Passez à la formule Starter (19 900 F) ou Business Multi-Vendeurs (39 900 F pour 3 mois) et réglez en 1 clic par <strong>Wave, Orange Money ou MTN</strong>.
            </p>
          </div>
          <Link
            href="/espace/parametres/facturation"
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-sm transition hover:bg-emerald-300 active:scale-95 cursor-pointer shrink-0"
          >
            <CreditCard size={14} />
            <span>Gérer mon Abonnement</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <BusinessCategorySettings />
      <AutomationsHubView />

      <PageHeader
        eyebrow={t("settings_eyebrow")}
        title={t("settings_title")}
        description={t("settings_desc")}
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
