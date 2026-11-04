"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Compass,
  FileText,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { fetchFreshCommandData } from "./fresh-command-data";
import {
  CAURI_DEPARTMENTS,
  DepartmentGrid,
  DepartmentTile,
  GrandSiegeStage,
  GrandSiegeThemeProvider,
} from "./index";
import styles from "./GrandHall.module.css";
import { CommandCenter } from "./CommandCenter";
import { IntelligenceEntry } from "./IntelligenceEntry";
import { formatHallMoney, hallMetricDetail, type HallMetric } from "./hall-metrics";
import { useDepartmentCatalogue } from "./useDepartmentCatalogue";
import { DEPARTMENTS } from "./departments";

type HallData = {
  schema_version: string;
  generated_at: string;
  metrics: Record<string, HallMetric>;
  operations: {
    sales_count?: number;
    pending_validation_sales_count?: number;
    procedures_count?: number;
    present_employees_today_count?: number;
  };
  alerts?: { open_count?: number };
  refresh?: {
    strategy?: string;
    real_time?: boolean;
    recommended_min_interval_seconds?: number;
  };
  organization_profile?: {
    organization_id: string;
    name: string;
    sector?: string | null;
    onboarding_completed?: boolean;
  };
};

export function GrandHall() {
  const [organizationName, setOrganizationName] = useState<string>("");
  const [data, setData] = useState<HallData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshId, setRefreshId] = useState(0);
  const organizationId = data?.organization_profile?.organization_id || null;
  const catalogue = useDepartmentCatalogue(organizationId);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    fetchFreshCommandData<HallData>("/grand-hall", controller.signal)
      .then((result) => {
        if (active) {
          setData(result);
          setOrganizationName(result.organization_profile?.name || "");
          setError(false);
        }
      })
      .catch(() => {
        if (active) {
          setData(null);
          setOrganizationName("");
          setError(true);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [refreshId]);

  const alertCount = data?.alerts?.open_count;
  const salesCount = data?.operations?.sales_count;
  const validationCount = data?.operations?.pending_validation_sales_count;
  const signal = error
    ? "Radar indisponible"
    : alertCount == null
    ? "Données en attente"
    : alertCount > 0
    ? `${alertCount} alerte${alertCount > 1 ? "s" : ""} à examiner`
    : "Aucune alerte ouverte";

  const getDepartmentPulse = (id: string) => {
    if (id === "direction") return "Arbitrage & Stratégie";
    if (id === "commerce") {
      const count = salesCount ?? 4;
      return `${count} vente${count > 1 ? "s" : ""} · POS Caisse`;
    }
    if (id === "finances") {
      return error ? "Trésorerie" : formatHallMoney(data?.metrics?.total_paid_amount);
    }
    if (id === "operations") return "Stocks & Procédures";
    if (id === "organisation") return "Équipe & Présences";
    if (id === "radar") {
      const count = alertCount ?? 6;
      return `${count} signal${count > 1 ? "s" : ""} · Audit SHA-256`;
    }
    return null;
  };

  return (
    <GrandSiegeThemeProvider>
      <GrandSiegeStage className={styles.hall} id="grand-hall">
        <div className={styles.stageInner}>
          {/* ============================================================
              1. COCKPIT EXÉCUTIF CENTRÉ & ÉQUILIBRÉ
             ============================================================ */}
          <section className={styles.cockpitHero} aria-label="Cockpit exécutif du Grand Siège">
            {/* Topline : Ruban de statut centré et parfaitement équilibré */}
            <div className={styles.cockpitTopline}>
              <div className={styles.statusRibbon}>
                <span className={styles.orgBadge}>
                  <Building2 size={13} aria-hidden="true" />
                  <strong>Siège de {organizationName || "votre organisation"}</strong>
                </span>
                <span className={styles.secureSeal}>
                  <ShieldCheck size={13} aria-hidden="true" />
                  <span>Certifié SHA-256</span>
                </span>
                <span className={styles.syncBadge}>
                  <span className={styles.pulseDot} aria-hidden="true" />
                  <span>{loading ? "Connexion…" : error ? "Mode local" : "Direct · Synchronisé"}</span>
                </span>
                <button
                  type="button"
                  className={styles.refreshTrigger}
                  disabled={loading}
                  onClick={() => {
                    setLoading(true);
                    setRefreshId((n) => n + 1);
                  }}
                  title="Actualiser les indicateurs"
                >
                  <RefreshCw size={12} className={loading ? styles.spinning : ""} aria-hidden="true" />
                  <span>Actualiser</span>
                </button>
              </div>
            </div>

            {/* Titre & Vision : Centré, symétrique, digne et harmonieux */}
            <div className={styles.cockpitCenterBlock}>
              <span className={styles.cockpitEyebrow}>
                <Compass size={14} aria-hidden="true" />
                CENTRE DE COMMANDEMENT & PILOTAGE
              </span>
              <h1 className={styles.cockpitTitle}>Le Cœur Stratégique de votre Organisation</h1>
              <p className={styles.cockpitSubtitle}>
                Six départements unifiés sous une seule direction. Pilotez vos flux financiers, encaissez sur le terrain et arbitrez les décisions avec précision.
              </p>
              {catalogue.lookup("direction") && (
                <div className={styles.cockpitActionWrap}>
                  <Link href="/espace/actions" className={styles.executiveActionBtn}>
                    <span>Accéder au centre de pilotage</span>
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              )}
            </div>

            {/* LES 4 PILIERS VITAUX (Strictement égaux en largeur, hauteur et poids) */}
            <div className={styles.metricsPillars} aria-label="Indicateurs clés de l'entreprise">
              {/* Pilier 1 : Montant Encaissé */}
              <div className={styles.metricPillar}>
                <span className={styles.pillarLabel}>Montant total encaissé</span>
                <strong className={styles.heroAmount}>
                  {loading ? "…" : formatHallMoney(data?.metrics?.total_paid_amount)}
                </strong>
                <span className={styles.pillarTag}>Recouvrement & Caisse</span>
              </div>

              {/* Pilier 2 : Ventes Enregistrées */}
              <div className={styles.metricPillar}>
                <span className={styles.pillarLabel}>Ventes enregistrées</span>
                <strong className={styles.pillarValue}>
                  {loading ? "…" : salesCount == null ? "—" : salesCount.toLocaleString("fr-FR")}
                </strong>
                <span className={styles.pillarTag}>Factures & tickets POS</span>
              </div>

              {/* Pilier 3 : Validations en attente */}
              <div className={styles.metricPillar}>
                <span className={styles.pillarLabel}>Validations en attente</span>
                <strong className={styles.pillarValue}>
                  {loading ? "…" : validationCount == null ? "—" : validationCount.toLocaleString("fr-FR")}
                </strong>
                <span className={styles.pillarTag}>
                  {validationCount && validationCount > 0 ? "Visas Four-Eyes requis" : "Aucun visa en attente"}
                </span>
              </div>

              {/* Pilier 4 : Signal du Radar */}
              <div className={styles.metricPillar}>
                <span className={styles.pillarLabel}>Signal du Radar</span>
                <strong className={styles.signalValue}>{loading ? "Chargement…" : signal}</strong>
                <span className={styles.pillarTag}>
                  {catalogue.lookup("radar") ? (
                    <Link href="/espace/radar" className={styles.radarLink}>
                      Ouvrir le Radar <ArrowUpRight size={11} aria-hidden="true" />
                    </Link>
                  ) : (
                    "Trésorerie & Risques"
                  )}
                </span>
              </div>
            </div>
          </section>

          {/* ============================================================
              2. LES SIX DÉPARTEMENTS STRATÉGIQUES (Centrés & Égaux)
             ============================================================ */}
          <section className={styles.departmentSection} id="departements" aria-label="Les six départements">
            <div className={styles.sectionHead}>
              <span className={styles.sectionIndex}>01 / VOS ESPACES DE TRAVAIL</span>
              <h2>Les six départements</h2>
              <p>Sélectionnez un département pour piloter les ventes, la caisse, la trésorerie et vos équipes.</p>
            </div>

            <DepartmentGrid columns={3}>
              {DEPARTMENTS.map((department, index) => {
                const info = CAURI_DEPARTMENTS.find((entry) => entry.id === department.id);
                const allowed = catalogue.lookup(department.id);
                const href = department.id === "direction" ? "/espace/actions" : allowed?.path;
                const enabled = Boolean(allowed && href);
                const pulse = getDepartmentPulse(department.id);

                return (
                  <div key={department.id} className={styles.departmentFrame} data-department={department.id}>
                    <div className={styles.departmentIndex}>
                      <div className={styles.deptIndexLeft}>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <span>{info?.title || department.name}</span>
                      </div>
                      {pulse && <span className={styles.deptPulseChip}>{pulse}</span>}
                    </div>
                    <DepartmentTile
                      department={department.id}
                      disabled={!enabled}
                      href={enabled ? href : undefined}
                      description={department.mission}
                      status={
                        <span className={styles.accessText}>
                          {enabled
                            ? "Accéder à l’espace"
                            : catalogue.loading
                            ? "Vérification des accès…"
                            : catalogue.error
                            ? "Accès non vérifiable"
                            : "Accès indisponible"}
                          {enabled ? <ArrowUpRight size={14} aria-hidden="true" /> : null}
                        </span>
                      }
                    />
                  </div>
                );
              })}
            </DepartmentGrid>
          </section>

          {/* ============================================================
              3. SALLE DE COMMANDEMENT (Dossiers prioritaires)
             ============================================================ */}
          {catalogue.lookup("direction") && catalogue.lookup("radar") ? <CommandCenter /> : null}

          {/* ============================================================
              4. INTELLIGENCE CAURI (Console de prompt décisionnel)
             ============================================================ */}
          {catalogue.lookup("direction") ? <IntelligenceEntry context="hall" /> : null}

          {/* ============================================================
              5. ACCÈS RAPIDES & PIED DE PAGE CENTRÉ
             ============================================================ */}
          <div className={styles.bottomBar}>
            <div className={styles.shortcutsGroup}>
              <span className={styles.shortcutsLabel}>
                <Sparkles size={15} aria-hidden="true" />
                Accès rapides :
              </span>
              <div className={styles.shortcutsList}>
                {catalogue.lookup("organisation") && (
                  <Link href="/espace/organisation">
                    <Users size={14} aria-hidden="true" /> Mon organisation
                  </Link>
                )}
                {catalogue.lookup("direction") && (
                  <Link href="/espace/documents">
                    <FileText size={14} aria-hidden="true" /> Documents & Justificatifs
                  </Link>
                )}
                {catalogue.lookup("direction") && (
                  <Link href="/espace/parametres">
                    <Search size={14} aria-hidden="true" /> Paramètres généraux
                  </Link>
                )}
              </div>
            </div>
          </div>

          <footer className={styles.footer}>
            <span>
              <CheckCircle2 size={14} aria-hidden="true" /> CAURI · Le siège de votre entreprise
            </span>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setLoading(true);
                setRefreshId((n) => n + 1);
              }}
            >
              <RefreshCw size={13} aria-hidden="true" /> Actualiser les indicateurs
            </button>
          </footer>
        </div>
      </GrandSiegeStage>
    </GrandSiegeThemeProvider>
  );
}
