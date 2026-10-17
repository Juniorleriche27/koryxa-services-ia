"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Building2, Compass } from "lucide-react";
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
  const allowed = Boolean(catalogue.lookup(department.id));

  return (
    <GrandSiegeThemeProvider>
      <div className={styles.frame}>
        <header className={styles.masthead}>
          <div className={styles.mastheadTop}>
            <Link className={styles.back} href="/espace"><ArrowLeft size={16} aria-hidden="true" /> Grand Hall</Link>
            <span className={styles.identity}><Building2 size={14} aria-hidden="true" /> CAURI{organizationName ? ` · ${organizationName}` : ""}</span>
          </div>
          <div className={styles.headline}>
            <span className={styles.kicker}><Compass size={15} aria-hidden="true" /> DÉPARTEMENT / {String(DEPARTMENTS.findIndex((entry) => entry.id === department.id) + 1).padStart(2, "0")}</span>
            <h1>{department.name}</h1>
            <p>{department.mission}</p>
          </div>
          <nav className={styles.localNav} aria-label={`Navigation — ${department.name}`} tabIndex={0}>
            {allowed && department.sections.map((item) => (
              <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined} className={styles.localLink}>
                {item.label}{pathname === item.href ? <span className={styles.activeMark} aria-hidden="true" /> : null}
              </Link>
            ))}
          </nav>
        </header>
        <div className={styles.content} id="department-content">
          <div className={styles.currentSection}><span>{section.label}</span><Link href="/espace" title="Retourner au Grand Hall">Tous les départements <ArrowUpRight size={15} aria-hidden="true" /></Link></div>
          {allowed ? <><IntelligenceEntry context={department.id} compact />{children}</> : <p role="status">{catalogue.loading ? 'Vérification de vos accès…' : catalogue.error ? 'Impossible de vérifier les autorisations pour cette entreprise. Réessayez après avoir actualisé la page.' : 'Ce département est indisponible pour votre rôle.'}</p>}
        </div>
      </div>
    </GrandSiegeThemeProvider>
  );
}
