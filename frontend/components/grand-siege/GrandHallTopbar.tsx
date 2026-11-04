"use client";

import Link from 'next/link';
import Image from 'next/image';
import { UserButton } from '@clerk/nextjs';
import { ArrowUpRight, BookOpen, ChevronDown, CircleHelp, ExternalLink, Mic, PhoneCall, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { LanguageSelector } from '@/components/app/LanguageSelector';
import styles from './GrandHallTopbar.module.css';

/**
 * Grand Hall Sovereign Header.
 * Architectural, institutional, non-ordinary topbar for CAURI.
 */
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
  return (
    <header className={styles.header}>
      {/* Sovereign decorative hairline pediment */}
      <div className={styles.pedimentLine} aria-hidden="true" />
      
      <div className={styles.inner}>
        {/* Brand identity: Emblem + Sovereign status badge */}
        <Link href="/espace" className={styles.brand} aria-label="CAURI — Grand Siège, accueil">
          <Image
            className={styles.brandLogo}
            src="/image(20261021-163619).png"
            alt="CAURI"
            width={2048}
            height={682}
            priority
            unoptimized
          />
          <span className={styles.brandSeparator} aria-hidden="true" />
          <span className={styles.brandStatus}>
            <span className={styles.brandStatusPill}>
              <span className={styles.pulseDot} aria-hidden="true" />
              <strong className={styles.brandName}>GRAND SIÈGE</strong>
              <span className={styles.brandTag}>SOUVERAIN</span>
            </span>
          </span>
        </Link>

        {/* Central Sovereign Omni-Command Bar */}
        <div className={styles.commandCenter}>
          <button
            type="button"
            onClick={onSearch}
            className={styles.search}
            aria-label={searchLabel}
            title="Recherche universelle & commandes (Ctrl + K)"
          >
            <div className={styles.searchLeft}>
              <Search size={17} className={styles.searchIcon} aria-hidden="true" />
              <span className={styles.searchText}>{searchLabel}</span>
            </div>
            <div className={styles.searchRight}>
              <span className={styles.searchCommandBadge} aria-hidden="true">
                <Sparkles size={11} />
                <span>Actions</span>
              </span>
              <kbd className={styles.searchKbd}>⌘ K</kbd>
            </div>
          </button>
        </div>

        {/* Sovereign Action Suite */}
        <div className={styles.actions}>
          {/* Security status chip (Desktop) */}
          <div className={styles.securityChip} title="Système d'audit SHA-256 et communications chiffrées">
            <ShieldCheck size={14} className={styles.securityIcon} aria-hidden="true" />
            <span>Sécurisé</span>
          </div>

          {/* Voice Cashier / Dictation Trigger */}
          <button
            type="button"
            onClick={onVoice}
            className={styles.voiceButton}
            aria-label={vocalLabel}
            title={vocalLabel}
          >
            <Mic size={17} aria-hidden="true" />
            <span className={styles.voiceText}>{vocalLabel}</span>
          </button>

          {/* Aide & Ressources */}
          <details className={styles.helpMenu}>
            <summary className={styles.iconAction} aria-label="Aide et ressources" title="Aide et ressources">
              <CircleHelp size={18} aria-hidden="true" />
              <ChevronDown size={12} className={styles.chevron} aria-hidden="true" />
            </summary>
            <div className={styles.popover}>
              <span className={styles.menuTitle}>Aide & ressources</span>
              <button
                type="button"
                onClick={(event) => {
                  event.currentTarget.closest('details')?.removeAttribute('open');
                  onHelp();
                }}
              >
                <BookOpen size={16} aria-hidden="true" /> Guide et visite
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.currentTarget.closest('details')?.removeAttribute('open');
                  onContact();
                }}
              >
                <PhoneCall size={16} aria-hidden="true" /> Nous contacter
              </button>
              <Link
                href="https://service-ia.koryxa.fr"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink size={16} aria-hidden="true" /> Site public <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            </div>
          </details>

          {/* Language Selector */}
          <span className={styles.language}>
            <LanguageSelector />
          </span>

          <span className={styles.divider} aria-hidden="true" />

          {/* User Profile Avatar with Sovereign Halo */}
          <div className={styles.avatarWrapper}>
            <UserButton appearance={{ elements: { avatarBox: 'h-9 w-9 rounded-full' } }} />
          </div>
        </div>
      </div>
    </header>
  );
}
