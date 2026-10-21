"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Building2, CheckCircle2, CircleAlert, Compass, FileText, RefreshCw, Search, ShieldCheck, Sparkles, Users } from "lucide-react";
import { fetchFreshCommandData } from "./fresh-command-data";
import { ArchitecturalSurface, CAURI_DEPARTMENTS, DepartmentGrid, DepartmentTile, GrandSiegeStage, GrandSiegeThemeProvider, InstitutionalHeading } from "./index";
import styles from "./GrandHall.module.css";
import { CommandCenter } from "./CommandCenter";
import { IntelligenceEntry } from "./IntelligenceEntry";
import { formatHallMoney, hallMetricDetail, type HallMetric } from "./hall-metrics";
import { useDepartmentCatalogue } from './useDepartmentCatalogue';
import { DEPARTMENTS } from './departments';
type HallData = {
  schema_version: string;
  generated_at: string;
  metrics: Record<string, HallMetric>;
  operations: { sales_count?: number; pending_validation_sales_count?: number; procedures_count?: number; present_employees_today_count?: number };
  alerts?: { open_count?: number };
  refresh?: { strategy?: string; real_time?: boolean; recommended_min_interval_seconds?: number };
  organization_profile?: { organization_id: string; name: string; sector?: string | null; onboarding_completed?: boolean };
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
    fetchFreshCommandData<HallData>('/grand-hall', controller.signal)
      .then((result) => { if (active) { setData(result); setOrganizationName(result.organization_profile?.name || ''); setError(false); } })
      .catch(() => { if (active) { setData(null); setOrganizationName(''); setError(true); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [refreshId]);

  const alertCount = data?.alerts?.open_count;
  const salesCount = data?.operations?.sales_count;
  const validationCount = data?.operations?.pending_validation_sales_count;
  const signal = error ? "Radar indisponible" : alertCount == null ? "Données en attente" : alertCount > 0 ? `${alertCount} alerte${alertCount > 1 ? "s" : ""} à examiner` : "Aucune alerte ouverte";

  return (
    <GrandSiegeThemeProvider>
      <GrandSiegeStage className={styles.hall} id="grand-hall">
        <div className={styles.topline}>
          <span className={styles.identity}><Image className={styles.officialLogo} src="/image(20261021-163619).png" alt="CAURI" width={2048} height={682} unoptimized /><span className={styles.divider} aria-hidden="true" />LE GRAND SIÈGE</span>
          <span className={styles.secure}><ShieldCheck size={14} aria-hidden="true" /> Espace entreprise</span>
        </div>

        <div className={styles.intro}>
          <div>
            <InstitutionalHeading eyebrow="BIENVENUE DANS VOTRE SIÈGE NUMÉRIQUE" title="La clarté pour décider. L’espace pour grandir." description="Une vue d’ensemble de votre entreprise, des décisions importantes aux équipes qui les réalisent." />
            {organizationName && <p className={styles.organization}><Building2 size={15} aria-hidden="true" /> Siège de {organizationName}</p>}
          </div>
          <div className={styles.today} aria-label="Centre de pilotage">
            <span className={styles.todayTitle}><span className={styles.pulse} /> CENTRE DE PILOTAGE</span>
            <span className={styles.todayDescription}>Une vue claire. Des décisions plus simples.</span>
            {catalogue.lookup('direction') ? <Link href="/espace/actions">Voir les actions <ArrowUpRight size={15} aria-hidden="true" /></Link> : null}
          </div>
        </div>

        <section className={styles.commandRoom} aria-label="Atrium et centre stratégique CAURI">
          <div className={styles.architecture} aria-hidden="true">
            <span className={styles.sunlight} />
            <span className={styles.pillarLeft} /><span className={styles.pillarRight} />
            <span className={styles.upperBridge} /><span className={styles.horizon} />
            <span className={styles.centralRing}><span className={styles.innerRing} /></span>
            <span className={styles.floorOne} /><span className={styles.floorTwo} />
          </div>
          <div className={styles.roomInfo}>
            <span className={styles.roomEyebrow}><Compass size={14} aria-hidden="true" /> SALLE CENTRALE · 00</span>
            <h2>Le cœur de votre organisation</h2>
            <p>Six départements. Une seule direction.</p>
          </div>
          <div className={styles.roomSignals}>
            <span><span className={styles.signalDot} /> {loading ? "Connexion aux indicateurs…" : error ? "Indicateurs indisponibles" : "Synthèse disponible"}</span>
            {catalogue.lookup('radar') ? <Link href="/espace/radar">Ouvrir le Radar <ArrowUpRight size={14} aria-hidden="true" /></Link> : null}
          </div>
        </section>

        <section className={styles.metrics} aria-label="Indicateurs de l'entreprise">
          <div className={styles.metric}><span>Ventes enregistrées</span><strong>{loading ? "…" : salesCount == null ? "—" : salesCount.toLocaleString("fr-FR")}</strong><small>Nombre de ventes</small></div>
          <div className={styles.metric}><span>Montant encaissé</span><strong>{loading ? "…" : formatHallMoney(data?.metrics?.total_paid_amount)}</strong><small>{error ? "Indicateurs indisponibles" : hallMetricDetail(data?.metrics?.total_paid_amount)}</small></div>
          <div className={styles.metric}><span>Validations en attente</span><strong>{loading ? "…" : validationCount == null ? "—" : validationCount.toLocaleString("fr-FR")}</strong><small>Ventes à confirmer</small></div>
          <div className={styles.metric}><span>Signal du Radar</span><strong className={styles.signalText}>{loading ? "Chargement…" : signal}</strong><small>{data?.refresh?.real_time ? "Actualisation temps réel" : "Actualisation à la demande"}</small></div>
        </section>

        {catalogue.lookup('direction') && catalogue.lookup('radar') ? <CommandCenter /> : null}
        {catalogue.lookup('direction') ? <IntelligenceEntry context="hall" /> : null}

        <div className={styles.sectionHead} id="departements">
          <div><span className={styles.sectionIndex}>01 / EXPLORER VOTRE SIÈGE</span><h2>Les départements</h2><p>Entrez dans un département pour retrouver vos outils et opérations.</p></div>
          <span className={styles.departmentCount}>06 ESPACES</span>
        </div>
        <DepartmentGrid>
          {DEPARTMENTS.map((department, index) => {
            const info = CAURI_DEPARTMENTS.find((entry) => entry.id === department.id);
            const allowed = catalogue.lookup(department.id);
            const href = department.id === 'direction' ? '/espace/actions' : allowed?.path;
            const enabled = Boolean(allowed && href);
            return <div key={department.id} className={styles.departmentFrame}>
              <span className={styles.departmentIndex}>{String(index + 1).padStart(2, '0')} / {info?.title}</span>
              <DepartmentTile department={department.id} disabled={!enabled} href={enabled ? href : undefined} description={department.mission} status={<span className={styles.accessText}>{enabled ? 'Entrer dans le département' : catalogue.loading ? 'Vérification des accès…' : catalogue.error ? 'Accès non vérifiable' : 'Accès indisponible'}{enabled ? <ArrowUpRight size={14} aria-hidden="true" /> : null}</span>} />
            </div>;
          })}
        </DepartmentGrid>

        <div className={styles.bottomRow}>
          <ArchitecturalSurface className={styles.alertSurface}>
            <div className={styles.bottomHeading}><CircleAlert size={19} aria-hidden="true" /><strong>Tableau de veille</strong></div>
            <p>{loading ? "Lecture de la situation de votre organisation…" : error ? "Les indicateurs ne sont pas disponibles pour le moment ; les départements restent accessibles." : signal}</p>
            {catalogue.lookup('radar') ? <Link href="/espace/radar">Consulter la veille <ArrowUpRight size={14} aria-hidden="true" /></Link> : null}
          </ArchitecturalSurface>
          <ArchitecturalSurface className={styles.alertSurface}>
            <div className={styles.bottomHeading}><Sparkles size={19} aria-hidden="true" /><strong>Vos accès rapides</strong></div>
            <div className={styles.shortcuts}>
              {catalogue.lookup('organisation') ? <Link href="/espace/organisation"><Users size={15} aria-hidden="true" /> Mon organisation</Link> : null}
              {catalogue.lookup('direction') ? <Link href="/espace/documents"><FileText size={15} aria-hidden="true" /> Documents</Link> : null}
              {catalogue.lookup('direction') ? <Link href="/espace/parametres"><Search size={15} aria-hidden="true" /> Paramètres</Link> : null}
            </div>
          </ArchitecturalSurface>
        </div>
        <div className={styles.footer}>
          <span><CheckCircle2 size={14} aria-hidden="true" /> CAURI · Le siège de votre entreprise</span>
          <button type="button" disabled={loading} onClick={() => { setLoading(true); setRefreshId((n) => n + 1); }}><RefreshCw size={14} aria-hidden="true" /> Actualiser les indicateurs</button>
        </div>
      </GrandSiegeStage>
    </GrandSiegeThemeProvider>
  );
}
