"use client";

import Link from 'next/link';
import Image from 'next/image';
import { UserButton } from '@clerk/nextjs';
import { ArrowUpRight, BookOpen, CircleHelp, ExternalLink, Mic, PhoneCall, Search } from 'lucide-react';
import { LanguageSelector } from '@/components/app/LanguageSelector';
import styles from './GrandHallTopbar.module.css';

/**
 * Floating Sovereign Island Header.
 * Narrower than the body container, centered, with equal bilateral balance.
 * Adaptable across all pages with contextual departmentLabel.
 */
export function GrandHallTopbar({
  searchLabel,
  vocalLabel,
  departmentLabel,
  onSearch,
  onVoice,
  onHelp,
  onContact,
}: {
  searchLabel: string;
  vocalLabel: string;
  departmentLabel?: string;
  onSearch: () => void;
  onVoice: () => void;
  onHelp: () => void;
  onContact: () => void;
}) {
  const displayBadge = departmentLabel
    ? departmentLabel.replace(/ et pilotage| et trésorerie| et stocks| et organisation/i, '').toUpperCase()
    : "GRAND SIÈGE";

  return (
    <div className={styles.headerWrapper}>
      <header className={styles.header}>
        {/* Left Wing: Brand emblem & status */}
        <div className={styles.leftWing}>
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
            <span className={styles.brandBadge}>
              <span className={styles.pulseDot} aria-hidden="true" />
              <span>{displayBadge}</span>
            </span>
          </Link>
        </div>

        {/* Center Core: Unified Omni-Command (Search + Voice) */}
        <div className={styles.centerDock}>
          <button
            type="button"
            onClick={onSearch}
            className={styles.search}
            aria-label={searchLabel}
            title="Recherche universelle & commandes (Ctrl + K)"
          >
            <Search size={15} className={styles.searchIcon} aria-hidden="true" />
            <span className={styles.searchText}>{searchLabel}</span>
            <kbd className={styles.searchKbd}>⌘ K</kbd>
          </button>

          <button
            type="button"
            onClick={onVoice}
            className={styles.voiceButton}
            aria-label={vocalLabel}
            title={vocalLabel}
          >
            <Mic size={15} aria-hidden="true" />
            <span className={styles.voiceText}>{vocalLabel}</span>
          </button>
        </div>

        {/* Right Wing: Balanced utilities (Help + Language + Profile) */}
        <div className={styles.rightWing}>
          <details className={styles.helpMenu}>
            <summary className={styles.iconAction} aria-label="Aide et ressources" title="Aide et ressources">
              <CircleHelp size={17} aria-hidden="true" />
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

          <span className={styles.language}>
            <LanguageSelector />
          </span>

          <span className={styles.divider} aria-hidden="true" />

          <div className={styles.avatarWrapper}>
            <UserButton appearance={{ elements: { avatarBox: 'h-8 w-8 rounded-full' } }} />
          </div>
        </div>
      </header>
    </div>
  );
}
