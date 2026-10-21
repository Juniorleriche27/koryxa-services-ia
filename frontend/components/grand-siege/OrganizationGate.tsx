"use client";

import Image from 'next/image';
import { ArrowRight, RefreshCw, ShieldCheck } from 'lucide-react';
import styles from './OrganizationGate.module.css';

/** Tenant-safe institutional status banner: no private information before identity verification. */
export function OrganizationGate({ loading, onRetry, errorCode }: { loading: boolean; onRetry: () => void; errorCode?: string }) {
  return <section className={styles.frame} role="status" aria-live="polite" aria-busy={loading} aria-label="Accès au siège CAURI">
    <div className={styles.bannerTop}>
      <div className={styles.brand}>
        <Image src="/image(20261021-163619).png" alt="CAURI" width={2048} height={682} className={styles.logo} unoptimized priority />
        <span className={styles.brandDivider} aria-hidden="true" />
        <small>GRAND SIÈGE</small>
      </div>
      <span className={styles.security}><ShieldCheck size={15} aria-hidden="true" /> Accès sécurisé</span>
    </div>

    <div className={styles.band}>
      <div className={styles.message}>
        <span className={styles.eyebrow}>ESPACE ENTREPRISE</span>
        <h1>{loading ? 'Préparation de votre espace' : 'Vérification de l’entreprise indisponible'}</h1>
        <p>{loading ? 'Nous confirmons votre organisation et vos autorisations avant d’ouvrir le siège.' : 'Votre organisation n’a pas pu être confirmée. Vos données restent protégées.'}</p>
      </div>
      <div className={styles.actionPanel}>
        <span className={styles.panelLabel}>{loading ? 'CONTRÔLE EN COURS' : 'ACTION RECOMMANDÉE'}</span>
        {loading ? <div className={styles.progress}><span className={styles.spinner} aria-hidden="true" /> Vérification sécurisée en cours…</div> : <button type="button" className={styles.retry} onClick={onRetry}><RefreshCw size={17} aria-hidden="true" /> Réessayer <ArrowRight size={16} aria-hidden="true" /></button>}
        <p className={styles.panelNote}>{loading ? 'L’accès sera ouvert après confirmation de vos droits.' : 'Relancez la vérification pour retrouver votre espace.'}</p>
        {!loading && errorCode ? <p className={styles.diagnostic}>Diagnostic de connexion : {errorCode}</p> : null}
      </div>
    </div>
    <footer className={styles.footer}><ShieldCheck size={15} aria-hidden="true" /> Aucun contenu d’entreprise n’est affiché avant vérification de vos droits.</footer>
  </section>;
}
