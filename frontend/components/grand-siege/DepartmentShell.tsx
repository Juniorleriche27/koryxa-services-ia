"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight, Building2, Compass, ShieldCheck, Layers3 } from "lucide-react";
import { GrandSiegeThemeProvider } from "./index";
import { DEPARTMENTS, resolveDepartment } from "./departments";
import { IntelligenceEntry } from "./IntelligenceEntry";
import { useDepartmentCatalogue } from './useDepartmentCatalogue';
import styles from "./DepartmentShell.module.css";

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

  if (isCompactDirection) {
    return (
      <GrandSiegeThemeProvider>
        <div className="flex flex-col lg:flex-row min-h-screen w-full bg-[#f8fbf8] text-slate-900" data-cauri-department={department.id}>
          {/* SIDEBAR GAUCHE FINE */}
          <aside className="w-full lg:w-64 lg:min-w-[256px] lg:max-w-[270px] border-b lg:border-b-0 lg:border-r border-slate-200/80 bg-white/95 p-4 sm:p-5 flex flex-col justify-between shrink-0 shadow-xs">
            <div>
              {/* Brand & Back to Grand Siège */}
              <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100">
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
                <Link
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition"
                  href="/"
                >
                  <ArrowLeft size={13} aria-hidden="true" /> Siège
                </Link>
              </div>

              {/* Department Name Badge */}
              <div className="mt-4 px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Département / {String(DEPARTMENTS.findIndex((entry) => entry.id === department.id) + 1).padStart(2, "0")}
                </span>
                <strong className="text-sm font-bold text-slate-950 block mt-0.5">
                  {department.name}
                </strong>
              </div>

              {/* Navigation des rubriques en Sidebar */}
              {allowed ? (
                <nav
                  className="mt-5 flex flex-col gap-1.5"
                  data-department-tabs={department.id}
                  aria-label={`Navigation — ${department.name}`}
                  tabIndex={0}
                >
                  {department.sections.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                          isActive
                            ? "bg-emerald-800 text-white shadow-xs font-bold"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                        }`}
                      >
                        <span>{item.label}</span>
                        {isActive && <span className="h-2 w-2 rounded-full bg-emerald-300" />}
                      </Link>
                    );
                  })}
                </nav>
              ) : null}
            </div>

            {/* Pied de Sidebar */}
            <div className="pt-4 border-t border-slate-100 hidden lg:flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <Building2 size={13} className="text-emerald-700" />
                {organizationName || "CAURI"}
              </span>
            </div>
          </aside>

          {/* CONTENU PRINCIPAL PLEINE LARGEUR */}
          <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8" id="department-content">
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
          </main>
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
