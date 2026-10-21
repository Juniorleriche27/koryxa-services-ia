"use client";

import Link from 'next/link';
import Image from 'next/image';
import { UserButton } from '@clerk/nextjs';
import { ArrowUpRight, BookOpen, ChevronDown, CircleHelp, ExternalLink, Mic, PhoneCall, Search } from 'lucide-react';
import { LanguageSelector } from '@/components/app/LanguageSelector';
import styles from './GrandHallTopbar.module.css';

/** Grand Hall only. The business-app topbar remains unchanged on all other routes. */
export function GrandHallTopbar({
  searchLabel,
  vocalLabel,
  onSearch,
  onVoice,
  onHelp,
  onContact,
}: {
  searchLabel: string;
  vocalLabel: string;
  onSearch: () => void;
  onVoice: () => void;
  onHelp: () => void;
  onContact: () => void;
}) {
  return <header className={styles.header}>
    <div className={styles.inner}>
      <Link href="/espace" className={styles.brand} aria-label="CAURI — Grand Siège, accueil">
        <Image className={styles.brandLogo} src="/image(20261021-163619).png" alt="CAURI" width={2048} height={682} priority unoptimized />
        <span className={styles.brandName}><small>GRAND SIÈGE</small></span>
      </Link>

      <button type="button" onClick={onSearch} className={styles.search} aria-label={searchLabel} title="Recherche et commandes (Ctrl + K)">
        <Search size={19} aria-hidden="true"/><span>{searchLabel}</span><kbd>⌘ K</kbd>
      </button>

      <div className={styles.actions}>
        <button type="button" onClick={onVoice} className={styles.iconAction} aria-label={vocalLabel} title={vocalLabel}><Mic size={19} aria-hidden="true"/></button>
        <details className={styles.helpMenu}>
          <summary className={styles.iconAction} aria-label="Aide et ressources" title="Aide et ressources"><CircleHelp size={19} aria-hidden="true"/><ChevronDown size={12} className={styles.chevron} aria-hidden="true"/></summary>
          <div className={styles.popover}>
            <span className={styles.menuTitle}>Aide & ressources</span>
            <button type="button" onClick={(event) => { event.currentTarget.closest('details')?.removeAttribute('open'); onHelp(); }}><BookOpen size={17} aria-hidden="true"/> Guide et visite</button>
            <button type="button" onClick={(event) => { event.currentTarget.closest('details')?.removeAttribute('open'); onContact(); }}><PhoneCall size={17} aria-hidden="true"/> Nous contacter</button>
            <Link href="https://service-ia.koryxa.fr" target="_blank" rel="noopener noreferrer"><ExternalLink size={17} aria-hidden="true"/> Site public <ArrowUpRight size={14} aria-hidden="true"/></Link>
          </div>
        </details>
        <span className={styles.language}><LanguageSelector /></span>
        <span className={styles.divider} aria-hidden="true"/>
        <span className={styles.avatar}><UserButton appearance={{ elements: { avatarBox: 'h-9 w-9' } }}/></span>
      </div>
    </div>
  </header>;
}
