"use client";

import Link from 'next/link';
import { BrainCircuit, Building2, Compass, Landmark } from 'lucide-react';
import { CAURI_AI_OPEN_EVENT, createIntelligenceRequest } from './intelligence-context';
import { resolveDepartment } from './departments';
import { useDepartmentCatalogue } from './useDepartmentCatalogue';
import styles from './MobileSiegeDock.module.css';

/** Navigation architecturale mobile. Aucun lien vers un département non autorisé. */
export function MobileSiegeDock({ pathname, organizationId, hidden = false }: { pathname: string; organizationId: string | null; hidden?: boolean }) {
  const catalogue = useDepartmentCatalogue(organizationId);
  const canUseAI = Boolean(organizationId && catalogue.lookup('direction'));
  const canSeePilotage = Boolean(catalogue.lookup('direction') && catalogue.lookup('radar'));
  const department = resolveDepartment(pathname)?.department.id;
  const context = department || 'hall';
  return <nav className={`${styles.dock} ${hidden ? styles.hidden : ''}`} aria-label="Navigation mobile du Grand Siège">
    <Link href="/espace" aria-current={pathname === '/espace' ? 'page' : undefined} className={styles.action}>
      <Landmark size={21} aria-hidden="true"/><span>Grand Hall</span>
    </Link>
    <Link href="/espace#departements" className={styles.action}>
      <Building2 size={21} aria-hidden="true"/><span>Départements</span>
    </Link>
    {!canSeePilotage ? <span className={`${styles.action} ${styles.unavailable}`} aria-label="Pilotage indisponible" aria-disabled="true"><Compass size={21} aria-hidden="true"/><span>Pilotage</span></span> : pathname === '/espace' ? <a href="#centre-commandement" className={styles.action}>
      <Compass size={21} aria-hidden="true"/><span>Pilotage</span>
    </a> : <Link href="/espace#centre-commandement" className={styles.action}>
      <Compass size={21} aria-hidden="true"/><span>Pilotage</span>
    </Link>}
    <button type="button" className={styles.action} disabled={!canUseAI} onClick={() => window.dispatchEvent(new CustomEvent(CAURI_AI_OPEN_EVENT, { detail: createIntelligenceRequest(context) }))}>
      <BrainCircuit size={21} aria-hidden="true"/><span>CAURI IA</span>
    </button>
  </nav>;
}
