"use client";

import { ArrowRight, ArrowUpRight, BrainCircuit, Lightbulb, ShieldCheck } from 'lucide-react';
import { CAURI_AI_OPEN_EVENT, createIntelligenceRequest } from './intelligence-context';
import type { DepartmentKey } from './departments';
import styles from './IntelligenceEntry.module.css';

/** Each suggestion only opens an editable draft in the existing AI copilot. */
export function IntelligenceEntry({ context, compact = false }: { context: DepartmentKey | 'hall'; compact?: boolean }) {
  const open = (prompt?: string) => window.dispatchEvent(new CustomEvent(CAURI_AI_OPEN_EVENT, {
    detail: prompt ? { prompt } : createIntelligenceRequest(context),
  }));

  return (
    <section className={`${styles.surface} ${compact ? styles.compact : ''}`} aria-label="Intelligence CAURI">
      <div className={styles.identity}><span className={styles.identityIcon}><BrainCircuit size={19} aria-hidden="true" /></span><span>INTELLIGENCE CAURI</span><span className={styles.identityLabel}>ASSISTANCE CONTEXTUELLE</span></div>
      <div className={styles.body}>
        <div className={styles.copy}>
          <h2>{compact ? 'Un regard éclairé sur votre département' : 'Que souhaitez-vous comprendre aujourd’hui ?'}</h2>
          <p>{compact ? 'Explorez vos priorités avec une question adaptée à ce département. Vous gardez la main sur l’envoi.' : 'Votre conseiller vous aide à explorer les données accessibles de votre entreprise. Chaque question reste modifiable avant envoi.'}</p>
        </div>
        <button type="button" className={styles.primaryAction} onClick={() => open()}>
          {compact ? 'Interroger CAURI' : 'Ouvrir mon conseiller'} <ArrowUpRight size={16} aria-hidden="true" />
        </button>
      </div>
      {!compact && <div className={styles.suggestions} aria-label="Suggestions de questions">
        <button type="button" onClick={() => open()}><Lightbulb size={16} aria-hidden="true" /><span>Faire le point sur mon entreprise</span><ArrowRight size={15} aria-hidden="true" /></button>
        <button type="button" onClick={() => open('Quels dossiers et actions méritent mon attention dans mon entreprise ? Appuie-toi seulement sur les données accessibles et indique les informations manquantes.')}><ShieldCheck size={16} aria-hidden="true" /><span>Examiner les priorités</span><ArrowRight size={15} aria-hidden="true" /></button>
        <button type="button" onClick={() => open('Quelles informations disponibles peuvent éclairer mes prochaines décisions ? Distingue les faits vérifiables des recommandations et précise les limites de ton analyse.')}><BrainCircuit size={16} aria-hidden="true" /><span>Préparer une décision</span><ArrowRight size={15} aria-hidden="true" /></button>
      </div>}
    </section>
  );
}
