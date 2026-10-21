import { ArrowUpRight, CheckCircle2, Search, WifiOff, RefreshCw, AlertCircle } from "lucide-react";
import styles from "./CauriEditorial.module.css";
import clsx from "clsx";
import type { Metric, RegisterItem } from "@/lib/service-ia/types";

export function PrimaryButton({ children }: { children: React.ReactNode }) { return <button className="app-button app-button-primary">{children}<ArrowUpRight size={16}/></button> }
export function SecondaryButton({ children }: { children: React.ReactNode }) { return <button className="app-button app-button-secondary">{children}</button> }
export function SearchBar({ placeholder="Rechercher…" }: { placeholder?: string }) { return <label className="app-search"><Search size={18}/><input placeholder={placeholder}/></label> }
export function StatusPill({ children }: { children: React.ReactNode }) { return <span className="app-status">{children}</span> }
export function MetricCard({ metric }: { metric: Metric }) { return <article className={clsx("app-metric", metric.tone)}><div><span>{metric.label}</span><strong>{metric.value}</strong></div><small>{metric.detail}</small><div className="app-meter"><i style={{width: metric.value}}/></div></article> }
export function RegisterList({ items }: { items: RegisterItem[] }) { return <div className="app-list">{items.map(item => <article className="app-list-row" key={item.id}><div className="app-list-icon"><CheckCircle2 size={19}/></div><div className="app-list-main"><strong>{item.title}</strong><span>{item.subtitle}</span></div><div className="app-list-meta"><StatusPill>{item.status}</StatusPill><small>{item.meta}</small></div>{item.value && <strong className="app-list-value">{item.value}</strong>}</article>)}</div> }

export function EmptyState({
  title,
  detail,
  onRetry,
}: {
  title: string;
  detail: string;
  onRetry?: () => void;
}) {
  const offline = /failed to fetch|networkerror|fetch failed|hors-ligne/i.test(detail);
  const Icon = offline ? WifiOff : AlertCircle;
  return (
    <section className={styles.emptyPanel} role="status" aria-live="polite">
      <div className={styles.emptyIcon}><Icon size={19} aria-hidden="true" /></div>
      <div className={styles.emptyCopy}>
        <span className={styles.emptyEyebrow}>{offline ? "CONNEXION" : "INFORMATION"}</span>
        <h3>{offline ? "Connexion au service indisponible" : title}</h3>
        <p>{offline ? "Le service ne répond pas actuellement. Vérifiez votre connexion, puis réessayez. Les éventuelles opérations locales ne sont pas confirmées comme synchronisées." : detail}</p>
      </div>
      {onRetry && <button type="button" onClick={onRetry} className={styles.emptyRetry}><RefreshCw size={15} aria-hidden="true" /> Réessayer</button>}
    </section>
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Top Subtle Loading Indicator */}
      <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-semibold text-emerald-800 dark:text-emerald-300">
            Chargement de la mémoire opérationnelle…
          </span>
        </div>
        <span className="text-[11px] font-mono opacity-60">Synchronisation active</span>
      </div>

      {/* 3 Premium Frosted Glass Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="kx-skeleton-glass kx-skeleton-wave p-5 rounded-2xl border border-emerald-500/20 space-y-3.5 shadow-[0_8px_24px_rgba(0,168,107,0.06)]"
          >
            <div className="flex items-center justify-between">
              <div className="w-28 h-3.5 rounded-full bg-emerald-500/15" />
              <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-emerald-500/30" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="w-40 h-7 rounded-xl bg-emerald-500/20" />
              <div className="w-24 h-2.5 rounded-full bg-emerald-500/10" />
            </div>
            {/* Ambient Progress bar */}
            <div className="w-full h-1.5 rounded-full bg-emerald-500/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                style={{ width: `${30 + i * 25}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar & Filter Tabs Frosted Glass Skeleton */}
      <div className="kx-skeleton-glass kx-skeleton-wave p-3 rounded-2xl border border-emerald-500/15 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="w-full sm:w-80 h-9 rounded-xl bg-emerald-500/10" />
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-20 rounded-xl bg-emerald-500/10 shrink-0" />
          ))}
        </div>
      </div>

      {/* Main Frosted Glass Table Container with Shimmer Rows */}
      <div className="kx-skeleton-glass kx-skeleton-wave rounded-2xl border border-emerald-500/20 overflow-hidden shadow-xs divide-y divide-emerald-500/10">
        {/* Table Header Placeholder */}
        <div className="p-4 bg-emerald-500/5 flex items-center justify-between gap-4">
          <div className="w-28 h-3 rounded-md bg-emerald-500/20" />
          <div className="w-32 h-3 rounded-md bg-emerald-500/15 hidden md:block" />
          <div className="w-24 h-3 rounded-md bg-emerald-500/15" />
          <div className="w-20 h-3 rounded-md bg-emerald-500/20 text-right" />
        </div>

        {/* Table Rows Placeholder with Glass Blur */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="p-4.5 flex items-center justify-between gap-4 hover:bg-emerald-500/5 transition duration-200"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 shrink-0 flex items-center justify-center">
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/25" />
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="w-36 sm:w-48 h-4 rounded-lg bg-emerald-500/20" />
                <div className="w-24 sm:w-32 h-2.5 rounded-md bg-emerald-500/10" />
              </div>
            </div>

            <div className="w-20 h-6 rounded-full bg-emerald-500/15 shrink-0 hidden sm:block" />
            <div className="space-y-1 text-right shrink-0">
              <div className="w-24 h-4 rounded-lg bg-emerald-500/25 ml-auto" />
              <div className="w-14 h-2.5 rounded-md bg-emerald-500/10 ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Top Live Badge */}
      <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-semibold text-emerald-800 dark:text-emerald-300">
            Initialisation du Cockpit Dirigeant…
          </span>
        </div>
      </div>

      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="kx-skeleton-glass kx-skeleton-wave p-5 rounded-2xl border border-emerald-500/20 space-y-3 shadow-[0_8px_24px_rgba(0,168,107,0.06)]"
          >
            <div className="flex items-center justify-between">
              <div className="w-28 h-3.5 rounded-full bg-emerald-500/15" />
              <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-emerald-500/30" />
              </div>
            </div>
            <div className="w-36 h-7 rounded-xl bg-emerald-500/20" />
            <div className="w-24 h-2.5 rounded-full bg-emerald-500/10" />
          </div>
        ))}
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 kx-skeleton-glass kx-skeleton-wave p-6 rounded-2xl border border-emerald-500/20 space-y-4 shadow-sm">
          <div className="w-48 h-5 rounded-xl bg-emerald-500/20" />
          <div className="w-full h-56 rounded-2xl bg-emerald-500/10" />
        </div>
        <div className="kx-skeleton-glass kx-skeleton-wave p-6 rounded-2xl border border-emerald-500/20 space-y-3.5 shadow-sm">
          <div className="w-36 h-5 rounded-xl bg-emerald-500/20" />
          <div className="w-full h-14 rounded-xl bg-emerald-500/10" />
          <div className="w-full h-14 rounded-xl bg-emerald-500/10" />
          <div className="w-full h-14 rounded-xl bg-emerald-500/10" />
        </div>
      </div>
    </div>
  );
}

