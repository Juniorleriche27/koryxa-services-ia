"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  CheckSquare,
  Compass,
  CreditCard,
  FileText,
  HelpCircle,
  Layers3,
  MessageSquare,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Truck,
} from "lucide-react";
import { GrandSiegeThemeProvider } from "./index";
import { DEPARTMENTS, resolveDepartment } from "./departments";
import { IntelligenceEntry } from "./IntelligenceEntry";
import { useDepartmentCatalogue } from './useDepartmentCatalogue';
import styles from "./DepartmentShell.module.css";

const SECTION_ICONS: Record<string, typeof CheckSquare> = {
  "/espace/actions": CheckSquare,
  "/espace/documents": FileText,
  "/espace/parametres": Settings,
  "/espace/parametres/facturation": CreditCard,
  "/espace/aide": HelpCircle,
  "/espace/ventes": ShoppingBag,
  "/espace/offres": Tag,
  "/espace/fournisseurs": Truck,
  "/espace/whatsapp": MessageSquare,
};

interface SectionMeta {
  title: string;
  badge: string;
  description: string;
}

const SECTION_TOOLTIPS: Record<string, SectionMeta> = {
  // 01 Direction
  "/espace/actions": {
    title: "Actions & Décisions",
    badge: "Priorités",
    description: "Plan d'actions, arbitrage et décisions stratégiques",
  },
  "/espace/documents": {
    title: "Documents Officiels",
    badge: "Coffre-fort",
    description: "Bilans, statuts, contrats et pièces probantes",
  },
  "/espace/parametres": {
    title: "Paramètres Généraux",
    badge: "Siège",
    description: "Profil entreprise, membres et configuration",
  },
  "/espace/parametres/facturation": {
    title: "Abonnement CAURI",
    badge: "Forfait",
    description: "Formule active, factures et consommation",
  },
  "/espace/aide": {
    title: "Assistance & Support",
    badge: "Guide",
    description: "Documentation pratique et contact support",
  },

  // 02 Commerce
  "/espace/ventes": {
    title: "Ventes & Facturation",
    badge: "POS & Factures",
    description: "Registre des ventes, encaissements et caisse comptoir",
  },
  "/espace/offres": {
    title: "Offres & Catalogue",
    badge: "Tarifs & Marges",
    description: "Catalogue produits/services, marges et alertes de stock",
  },
  "/espace/fournisseurs": {
    title: "Fournisseurs & Partenaires",
    badge: "Répertoire",
    description: "Annuaire prestataires et délais de règlement",
  },
  "/espace/whatsapp": {
    title: "WhatsApp & Relances",
    badge: "Messagerie IA",
    description: "Passerelle WhatsApp, relances 1-clic et solvabilité",
  },
};

const SETTINGS_HREFS = new Set([
  "/espace/parametres",
  "/espace/parametres/facturation",
  "/espace/aide",
]);

/** Presentation only: preserves the existing page and all backend authorization checks. */
export function DepartmentShell({ pathname, organizationName, organizationId, children }: {
  pathname: string;
  organizationName?: string;
  organizationId?: string;
  children: ReactNode;
}) {
  const resolved = resolveDepartment(pathname);
  const catalogue = useDepartmentCatalogue(organizationId || null);
  if (!resolved) return <>{children}</>;
  const { department, section } = resolved;
  // Direction and Commerce use the full-width operational workspace without repeated introductory blocks.
  const isCompactDirection = department.id === 'direction' || department.id === 'commerce';
  const allowed = Boolean(catalogue.lookup(department.id));
  const departmentNumber = String(DEPARTMENTS.findIndex((entry) => entry.id === department.id) + 1).padStart(2, "0");

  if (isCompactDirection) {
    const primarySections = department.sections.filter((item) => !SETTINGS_HREFS.has(item.href));
    const secondarySections = department.sections.filter((item) => SETTINGS_HREFS.has(item.href));

    const renderNavLink = (item: (typeof department.sections)[number]) => {
      const isActive = section.href === item.href;
      const Icon = SECTION_ICONS[item.href] || Layers3;
      const meta = SECTION_TOOLTIPS[item.href];

      return (
        <Link
          key={item.href}
          href={item.href}
          aria-label={item.label}
          aria-current={isActive ? "page" : undefined}
          title={meta ? `${meta.title} — ${meta.description}` : item.label}
          className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] transition-all whitespace-nowrap shrink-0 ${
            isActive
              ? "bg-emerald-800 text-white font-semibold shadow-sm"
              : "text-slate-600 font-medium hover:bg-emerald-50/80 hover:text-emerald-950"
          }`}
        >
          <span
            aria-hidden="true"
            className={`flex items-center justify-center w-6 h-6 rounded-lg shrink-0 transition-colors ${
              isActive
                ? "bg-emerald-700 text-emerald-100"
                : "bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-800"
            }`}
          >
            <Icon
              size={15}
              className={isActive ? "text-emerald-100 shrink-0" : "text-slate-500 group-hover:text-emerald-700 shrink-0"}
            />
          </span>
          <span className="truncate flex-1">{item.label}</span>
          {isActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 shrink-0" aria-hidden="true" />
          )}

          {/* Tooltip flottant sous le curseur au survol */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 hidden lg:group-hover:flex flex-col gap-0.5 rounded-xl bg-slate-900/95 text-white px-3.5 py-2.5 text-xs shadow-2xl border border-slate-700/80 z-50 whitespace-nowrap backdrop-blur-md"
          >
            <span className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-400" : "bg-emerald-500/70"}`} />
              <strong className="font-bold text-slate-100 text-[12.5px]">
                {meta?.title || item.label}
              </strong>
              {meta?.badge && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/40">
                  {meta.badge}
                </span>
              )}
            </span>
            {meta?.description && (
              <span className="text-[11px] text-slate-300 font-normal">
                {meta.description}
              </span>
            )}
            <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-slate-900 border-l border-b border-slate-700/80" />
          </span>
        </Link>
      );
    };

    return (
      <GrandSiegeThemeProvider>
        <div
          className="flex flex-col lg:flex-row min-h-screen w-full bg-[#f6faf7] text-slate-900"
          data-cauri-department={department.id}
        >
          {/* SIDEBAR LATÉRALE FIXE */}
          <aside className="w-full lg:w-64 lg:min-w-[256px] lg:max-w-[256px] lg:sticky lg:top-0 lg:h-screen border-b lg:border-b-0 lg:border-r border-emerald-950/10 bg-white px-4 py-3.5 lg:p-5 flex flex-col justify-between shrink-0 z-20">
            <div className="flex flex-col">
              {/* Logo officiel CAURI + Retour Grand Siège */}
              <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
                <Link href="/" title="Retourner à l'accueil du Grand Siège" className="inline-flex items-center">
                  <Image
                    src="/image(20261021-163619).png"
                    alt="CAURI"
                    width={2048}
                    height={682}
                    unoptimized
                    priority
                    style={{ width: "88px", height: "auto", maxHeight: "26px", objectFit: "contain" }}
                  />
                </Link>
                <Link
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-200/80 bg-emerald-50/70 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition"
                  href="/"
                >
                  <ArrowLeft size={13} aria-hidden="true" /> Grand Siège
                </Link>
              </div>

              {/* Identité du département actif */}
              <div className="mt-3.5 hidden lg:block rounded-xl border border-emerald-100 bg-emerald-50/45 px-3 py-2.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700 block">
                  Département {departmentNumber}
                </span>
                <strong className="text-sm font-bold text-slate-900 block mt-0.5 leading-snug">
                  {department.name}
                </strong>
              </div>

              {/* Navigation des rubriques */}
              {allowed ? (
                <nav
                  className="mt-3 lg:mt-5 flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0"
                  data-department-tabs={department.id}
                  aria-label={`Navigation — ${department.name}`}
                  tabIndex={0}
                >
                  {secondarySections.length > 0 && (
                    <span className="hidden lg:block px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Pilotage
                    </span>
                  )}
                  {primarySections.map(renderNavLink)}
                  {secondarySections.length > 0 && (
                    <>
                      <span
                        aria-hidden="true"
                        className="hidden lg:block my-2.5 border-t border-slate-100"
                      />
                      <span className="hidden lg:block px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                        Espace & Réglages
                      </span>
                      {secondarySections.map(renderNavLink)}
                    </>
                  )}
                </nav>
              ) : null}
            </div>

            {/* Pied de Sidebar */}
            <div className="pt-4 border-t border-slate-100 hidden lg:flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-2 font-semibold text-slate-700 truncate">
                <Building2 size={14} className="text-emerald-700 shrink-0" />
                <span className="truncate">{organizationName || "CAURI"}</span>
              </span>
              <span
                className="h-2 w-2 rounded-full bg-emerald-500 shrink-0"
                title="Espace synchronisé"
              />
            </div>
          </aside>

          {/* ZONE DE TRAVAIL PRINCIPALE */}
          <div className="flex-1 min-w-0 px-4 py-5 sm:px-6 lg:px-10 lg:py-8" id="department-content">
            <div className="mx-auto w-full max-w-[1160px]">
              {allowed ? (
                children
              ) : (
                <div className={styles.accessState} role="status" aria-live="polite">
                  <span className={styles.accessStateIcon}><ShieldCheck size={20} aria-hidden="true" /></span>
                  <div>
                    <strong>{catalogue.loading ? 'Vérification des autorisations' : catalogue.error ? 'Accès momentanément indisponible' : 'Département non accessible'}</strong>
                    <p>{catalogue.loading ? 'Nous vérifions vos droits d’accès pour cette entreprise.' : catalogue.error ? 'Impossible de confirmer vos autorisations. Actualisez la page pour réessayer.' : 'Ce département est indisponible pour votre rôle actuel.'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </GrandSiegeThemeProvider>
    );
  }

  return (
    <GrandSiegeThemeProvider>
      <div className={`${styles.frame} ${isCompactDirection ? styles.actionsWorkspace : ''}`} data-cauri-department={department.id}>
        <header className={styles.masthead}>
          <div className={styles.mastheadTop}>
            <div className="flex items-center gap-3">
              <Link href="/" title="Retourner à l'accueil du Grand Siège" className="inline-flex items-center">
                <Image
                  src="/image(20261021-163619).png"
                  alt="CAURI"
                  width={2048}
                  height={682}
                  unoptimized
                  priority
                  style={{ width: "95px", height: "auto", maxHeight: "28px", objectFit: "contain" }}
                />
              </Link>
              <Link className={styles.back} href="/"><ArrowLeft size={14} aria-hidden="true" /> Grand Siège</Link>
            </div>
            <span className={styles.identity}><Building2 size={14} aria-hidden="true" /> CAURI{organizationName ? ` · ${organizationName}` : ""}</span>
          </div>
          {!isCompactDirection && <div className={styles.departmentBanner}>
            <div className={styles.headline}>
              <span className={styles.kicker}><Compass size={15} aria-hidden="true" /> DÉPARTEMENT / {String(DEPARTMENTS.findIndex((entry) => entry.id === department.id) + 1).padStart(2, "0")}</span>
              <h1>{department.name}</h1>
              <p>{department.mission}</p>
            </div>
            <aside className={styles.departmentOverview} aria-label="Organisation du département">
              <span className={styles.overviewLabel}><Layers3 size={15} aria-hidden="true" /> ESPACES MÉTIER</span>
              <strong>{allowed ? department.sections.length : '—'}</strong>
              <p>{allowed ? `Retrouvez les ${department.sections.length} rubriques de ce département.` : 'Les rubriques sont présentées après vérification de vos accès.'}</p>
            </aside>
          </div>}
          {allowed ? <div className={styles.navigationBlock}>
            {!isCompactDirection && <span className={styles.navigationTitle}>ACCÉDER À UNE RUBRIQUE</span>}
            <nav className={styles.localNav} data-department-tabs={department.id} aria-label={`Navigation — ${department.name}`} tabIndex={0}>
              {department.sections.map((item) => (
                <Link key={item.href} href={item.href} aria-current={section.href === item.href ? "page" : undefined} className={styles.localLink}>
                  {item.label}{pathname === item.href ? <span className={styles.activeMark} aria-hidden="true" /> : null}
                </Link>
              ))}
            </nav>
          </div> : null}
        </header>
        <div className={styles.content} id="department-content">
          {!isCompactDirection && <div className={styles.currentSection}><div className={styles.currentCopy}><span>RUBRIQUE ACTIVE</span><strong>{section.label}</strong><small>{department.name}</small></div><Link href="/" title="Retourner au Grand Siège">Tous les départements <ArrowUpRight size={15} aria-hidden="true" /></Link></div>}
          {allowed ? <>{!isCompactDirection && <IntelligenceEntry context={department.id} compact />}{children}</> : <div className={styles.accessState} role="status" aria-live="polite"><span className={styles.accessStateIcon}><ShieldCheck size={20} aria-hidden="true" /></span><div><strong>{catalogue.loading ? 'Vérification des autorisations' : catalogue.error ? 'Accès momentanément indisponible' : 'Département non accessible'}</strong><p>{catalogue.loading ? 'Nous vérifions vos droits d’accès pour cette entreprise.' : catalogue.error ? 'Impossible de confirmer vos autorisations. Actualisez la page pour réessayer.' : 'Ce département est indisponible pour votre rôle actuel.'}</p></div></div>}
        </div>
      </div>
    </GrandSiegeThemeProvider>
  );
}
