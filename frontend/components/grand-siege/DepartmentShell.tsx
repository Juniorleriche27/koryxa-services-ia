"use client";

import type { ReactNode } from "react";
import Link from "next/link";
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
  const isActionsWorkspace = pathname === '/espace/actions';
  const allowed = Boolean(catalogue.lookup(department.id));

  return (
    <GrandSiegeThemeProvider>
      <div className={`${styles.frame} ${isActionsWorkspace ? styles.actionsWorkspace : ''}`} data-cauri-department={department.id}>
        <header className={styles.masthead}>
          <div className={styles.mastheadTop}>
            <Link className={styles.back} href="/espace"><ArrowLeft size={16} aria-hidden="true" /> Grand Hall</Link>
            <span className={styles.identity}><Building2 size={14} aria-hidden="true" /> CAURI{organizationName ? ` · ${organizationName}` : ""}</span>
          </div>
          {!isActionsWorkspace && <div className={styles.departmentBanner}>
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
            {!isActionsWorkspace && <span className={styles.navigationTitle}>ACCÉDER À UNE RUBRIQUE</span>}
            <nav className={styles.localNav} aria-label={`Navigation — ${department.name}`} tabIndex={0}>
              {department.sections.map((item) => (
                <Link key={item.href} href={item.href} aria-current={section.href === item.href ? "page" : undefined} className={styles.localLink}>
                  {item.label}{pathname === item.href ? <span className={styles.activeMark} aria-hidden="true" /> : null}
                </Link>
              ))}
            </nav>
          </div> : null}
        </header>
        <div className={styles.content} id="department-content">
          {!isActionsWorkspace && <div className={styles.currentSection}><div className={styles.currentCopy}><span>RUBRIQUE ACTIVE</span><strong>{section.label}</strong><small>{department.name}</small></div><Link href="/espace" title="Retourner au Grand Hall">Tous les départements <ArrowUpRight size={15} aria-hidden="true" /></Link></div>}
          {allowed ? <>{!isActionsWorkspace && <IntelligenceEntry context={department.id} compact />}{children}</> : <div className={styles.accessState} role="status" aria-live="polite"><span className={styles.accessStateIcon}><ShieldCheck size={20} aria-hidden="true" /></span><div><strong>{catalogue.loading ? 'Vérification des autorisations' : catalogue.error ? 'Accès momentanément indisponible' : 'Département non accessible'}</strong><p>{catalogue.loading ? 'Nous vérifions vos droits d’accès pour cette entreprise.' : catalogue.error ? 'Impossible de confirmer vos autorisations. Actualisez la page pour réessayer.' : 'Ce département est indisponible pour votre rôle actuel.'}</p></div></div>}
        </div>
      </div>
    </GrandSiegeThemeProvider>
  );
}
