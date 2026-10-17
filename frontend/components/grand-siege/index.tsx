import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { Activity, BriefcaseBusiness, Landmark, Radar, Settings2, ShoppingBag, Wallet, Users } from 'lucide-react';
import styles from './GrandSiege.module.css';

export type GrandSiegeTheme = 'light' | 'dark';
export type DepartmentId = 'direction' | 'commerce' | 'finances' | 'operations' | 'organisation' | 'radar';
export type DepartmentState = 'active' | 'attention' | 'critical' | 'idle';

export const CAURI_DEPARTMENTS: ReadonlyArray<{ id: DepartmentId; title: string; description: string }> = [
  { id: 'direction', title: 'Direction', description: 'Vision, décisions et objectifs' },
  { id: 'commerce', title: 'Commerce', description: 'Clients, ventes et facturation' },
  { id: 'finances', title: 'Finances', description: 'Trésorerie, paiements et dépenses' },
  { id: 'operations', title: 'Opérations', description: 'Équipes, procédures et activités' },
  { id: 'organisation', title: 'Membres et organisation', description: 'Équipe, membres et présences' },
  { id: 'radar', title: 'Radar et contrôle', description: 'Alertes, risques et validations' },
] as const;

const icons = {
  direction: BriefcaseBusiness,
  commerce: ShoppingBag,
  finances: Wallet,
  operations: Settings2,
  organisation: Users,
  radar: Radar,
} satisfies Record<DepartmentId, typeof Activity>;

/** Scoped visual boundary; safe to use alongside the current legacy application. */
export function GrandSiegeThemeProvider({ theme = 'light', children, className = '', ...props }: HTMLAttributes<HTMLDivElement> & { theme?: GrandSiegeTheme }) {
  return <div className={`${styles.root} ${className}`} data-theme={theme} {...props}>{children}</div>;
}

export function GrandSiegeStage({ children, className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={`${styles.stage} ${className}`} {...props}>{children}</section>;
}

export function ArchitecturalSurface({ children, command = false, className = '', ...props }: HTMLAttributes<HTMLDivElement> & { command?: boolean }) {
  return <div className={`${styles.surface} ${className}`} data-emphasis={command ? 'command' : 'regular'} {...props}>{children}</div>;
}

export function InstitutionalHeading({ title, description, eyebrow = 'CAURI · Grand Siège' }: { title: string; description?: string; eyebrow?: string }) {
  return <header><span className={styles.eyebrow}><Landmark size={14} aria-hidden="true" />{eyebrow}</span><h1 className={styles.heading}>{title}</h1>{description ? <p className={styles.description}>{description}</p> : null}</header>;
}

export function DepartmentStatus({ state = 'idle', label }: { state?: DepartmentState; label: string }) {
  return <span className={styles.status} data-tone={state}><span className={styles.statusDot} aria-hidden="true" />{label}</span>;
}

type DepartmentTileProps = {
  department: DepartmentId;
  description?: string;
  status?: ReactNode;
  href?: string;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
};

/** Uses actual links for navigation; no fake clickable tiles. */
export function DepartmentTile({ department, description, status, href, disabled = false, onClick, className = '' }: DepartmentTileProps) {
  const info = CAURI_DEPARTMENTS.find((item) => item.id === department);
  if (!info) return null;
  const Icon = icons[department];
  const content = <><span className={styles.departmentIcon}><Icon size={23} aria-hidden="true" /></span><span className={styles.departmentText}><span className={styles.departmentTitle}>{info.title}</span><span className={styles.departmentSummary}>{description ?? info.description}</span>{status ? <span style={{ display: 'block', marginTop: 10 }}>{status}</span> : null}</span></>;
  const classes = `${styles.department} ${className}`;
  if (disabled) return <div className={classes} data-disabled="true" aria-disabled="true">{content}</div>;
  if (href) return <a className={classes} href={href} data-actionable="true">{content}</a>;
  if (onClick) return <button className={classes} type="button" onClick={onClick} data-actionable="true">{content}</button>;
  return <div className={classes}>{content}</div>;
}

export function DepartmentGrid({ children, columns = 3, style }: { children: ReactNode; columns?: 2 | 3; style?: CSSProperties }) {
  return <div className={styles.departments} data-columns={columns} style={style}>{children}</div>;
}
