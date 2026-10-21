"use client";

import Image from 'next/image';
import { ArrowRight, RefreshCw, ShieldCheck } from 'lucide-react';
import styles from './OrganizationGate.module.css';

/** Tenant-safe branded placeholder: no company name, metrics or business data before identity is verified. */
export function OrganizationGate({ loading, onRetry, errorCode }: { loading: boolean; onRetry: () => void; errorCode?: string }) {
  return <section className={styles.frame} role="status" aria-live="polite" aria-busy={loading} aria-label="Accès au siège CAURI">
    <div className={styles.brand}><Image src="/image(20261021-163619).png" alt="CAURI" width={2048} height={682} className={styles.logo} unoptimized priority /><small>GRAND SIÈGE</small></div>
    <div className={styles.layout}>
      <div className={styles.intro}>
        <span className={styles.eyebrow}><ShieldCheck size={15} aria-hidden="true" /> ESPACE ENTREPRISE SÉCURISÉ</span>
        <h1>{loading ? 'Préparation de votre espace' : 'Accès à votre entreprise indisponible'}</h1>
        <p>{loading ? 'Nous vérifions votre organisation et vos autorisations pour ouvrir votre siège numérique.' : 'Nous ne pouvons pas confirmer votre organisation pour le moment. Vos données restent protégées. Vous pouvez relancer la vérification.'}</p>
        {loading ? <div className={styles.progress}><span className={styles.spinner} aria-hidden="true" /> Vérification sécurisée en cours…</div> : <div><button type="button" className={styles.retry} onClick={onRetry}><RefreshCw size={17} aria-hidden="true" /> Réessayer <ArrowRight size={16} aria-hidden="true" /></button>{errorCode ? <p className={styles.diagnostic}>Diagnostic de connexion : {errorCode}</p> : null}</div>}
      </div>
      <div className={styles.preview} aria-hidden="true"><span className={styles.previewEyebrow}>VOTRE VUE EXÉCUTIVE</span><div className={styles.previewTitle} /><div className={styles.previewSubtitle} /><div className={styles.previewCards}><span /><span /><span /></div><div className={styles.previewWide} /></div>
    </div>
    <footer className={styles.footer}><ShieldCheck size={15} aria-hidden="true" /> Aucun contenu d’entreprise n’est affiché avant vérification de vos droits.</footer>
  </section>;
}
