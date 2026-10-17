"use client";

import { BrainCircuit, ArrowUpRight } from 'lucide-react';
import { CAURI_AI_OPEN_EVENT, createIntelligenceRequest } from './intelligence-context';
import type { DepartmentKey } from './departments';
import styles from './IntelligenceEntry.module.css';

export function IntelligenceEntry({ context, compact = false }: { context: DepartmentKey | 'hall'; compact?: boolean }) {
  const open = () => window.dispatchEvent(new CustomEvent(CAURI_AI_OPEN_EVENT, { detail: createIntelligenceRequest(context) }));
  return <div className={`${styles.surface} ${compact ? styles.compact : ''}`}>
    <div className={styles.identity}><BrainCircuit size={20} aria-hidden="true" /><span>INTELLIGENCE CAURI · ASSISTANCE</span></div>
    <div className={styles.body}>
      <div><h2>{compact ? 'Votre conseiller IA' : 'L’intelligence au service de vos décisions'}</h2><p>Posez une question sur votre organisation ou analysez vos priorités. Les réponses dépendent des informations auxquelles vous avez accès.</p></div>
      <button type="button" onClick={open}>Consulter l’intelligence <ArrowUpRight size={16} aria-hidden="true" /></button>
    </div>
  </div>;
}
