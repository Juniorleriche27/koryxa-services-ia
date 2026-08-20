import { ArrowUpRight, CheckCircle2, Search, WifiOff, RefreshCw, AlertCircle } from "lucide-react";
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
  const isOfflineError =
    detail.toLowerCase().includes("failed to fetch") ||
    detail.toLowerCase().includes("networkerror") ||
    detail.toLowerCase().includes("fetch failed") ||
    detail.toLowerCase().includes("hors-ligne") ||
    detail.toLowerCase().includes("indisponible");

  if (isOfflineError) {
    return (
      <div className="p-8 sm:p-12 text-center rounded-3xl bg-card border border-border/80 shadow-xs flex flex-col items-center justify-center max-w-lg mx-auto my-6 animate-in fade-in duration-300">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 border border-amber-500/20">
          <WifiOff size={28} />
        </div>
        <h3 className="text-base sm:text-lg font-black text-foreground tracking-tight mb-1">
          Connexion réseau interrompue
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-5 leading-relaxed max-w-sm">
          Impossible de contacter le serveur distant. Vos opérations enregistrées hors-ligne seront synchronisées dès le retour d'Internet.
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:scale-[1.02] active:scale-[0.98] transition font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md"
          >
            <RefreshCw size={14} />
            <span>Réessayer la synchronisation</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="app-empty">
      <div className="app-empty-orb" />
      <h3>{title}</h3>
      <p>{detail}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 px-3 py-1.5 rounded-xl border border-border text-xs font-bold hover:bg-muted transition cursor-pointer"
        >
          Réessayer
        </button>
      )}
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* 3 Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card p-4 rounded-2xl border border-border/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-24 h-3 rounded-md bg-muted" />
              <div className="w-2 h-2 rounded-full bg-muted" />
            </div>
            <div className="w-36 h-6 rounded-lg bg-muted/80" />
            <div className="w-20 h-2.5 rounded-md bg-muted/60" />
          </div>
        ))}
      </div>

      {/* Table search & tabs skeleton */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="h-10 rounded-xl bg-muted/60 flex-1 max-w-md" />
          <div className="h-9 w-28 rounded-xl bg-muted/60" />
        </div>
        <div className="flex items-center gap-2 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 w-24 rounded-full bg-muted/60 shrink-0" />
          ))}
        </div>
      </div>

      {/* Table rows skeleton */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden divide-y divide-border/60">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 flex items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="w-32 h-4 rounded bg-muted/80" />
              <div className="w-48 h-3 rounded bg-muted/50" />
            </div>
            <div className="w-20 h-5 rounded-full bg-muted/60" />
            <div className="w-24 h-4 rounded bg-muted/80 text-right" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card p-4 rounded-2xl border border-border/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-24 h-3 rounded-md bg-muted" />
              <div className="w-2 h-2 rounded-full bg-muted" />
            </div>
            <div className="w-32 h-7 rounded-lg bg-muted/80" />
            <div className="w-20 h-2.5 rounded-md bg-muted/60" />
          </div>
        ))}
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card p-5 rounded-2xl border border-border/80 space-y-4">
          <div className="w-40 h-5 rounded-md bg-muted" />
          <div className="w-full h-48 rounded-xl bg-muted/40" />
        </div>
        <div className="bg-card p-5 rounded-2xl border border-border/80 space-y-3">
          <div className="w-32 h-5 rounded-md bg-muted" />
          <div className="w-full h-12 rounded-xl bg-muted/40" />
          <div className="w-full h-12 rounded-xl bg-muted/40" />
          <div className="w-full h-12 rounded-xl bg-muted/40" />
        </div>
      </div>
    </div>
  );
}

