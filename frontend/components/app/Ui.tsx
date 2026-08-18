import { ArrowUpRight, CheckCircle2, Search } from "lucide-react";
import clsx from "clsx";
import type { Metric, RegisterItem } from "@/lib/service-ia/types";

export function PrimaryButton({ children }: { children: React.ReactNode }) { return <button className="app-button app-button-primary">{children}<ArrowUpRight size={16}/></button> }
export function SecondaryButton({ children }: { children: React.ReactNode }) { return <button className="app-button app-button-secondary">{children}</button> }
export function SearchBar({ placeholder="Rechercher…" }: { placeholder?: string }) { return <label className="app-search"><Search size={18}/><input placeholder={placeholder}/></label> }
export function StatusPill({ children }: { children: React.ReactNode }) { return <span className="app-status">{children}</span> }
export function MetricCard({ metric }: { metric: Metric }) { return <article className={clsx("app-metric", metric.tone)}><div><span>{metric.label}</span><strong>{metric.value}</strong></div><small>{metric.detail}</small><div className="app-meter"><i style={{width: metric.value}}/></div></article> }
export function RegisterList({ items }: { items: RegisterItem[] }) { return <div className="app-list">{items.map(item => <article className="app-list-row" key={item.id}><div className="app-list-icon"><CheckCircle2 size={19}/></div><div className="app-list-main"><strong>{item.title}</strong><span>{item.subtitle}</span></div><div className="app-list-meta"><StatusPill>{item.status}</StatusPill><small>{item.meta}</small></div>{item.value && <strong className="app-list-value">{item.value}</strong>}</article>)}</div> }
export function EmptyState({ title, detail }: { title: string; detail: string }) { return <div className="app-empty"><div className="app-empty-orb"/><h3>{title}</h3><p>{detail}</p></div> }

export function DashboardSkeleton() {
  return (
    <div style={{ display: "grid", gap: 20, animation: "pulse 1.5s infinite ease-in-out" }}>
      {/* Metrics Row Skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              height: 105,
              borderRadius: 12,
              background: "var(--kx-surface-raised, #f8fafc)",
              border: "1px solid var(--kx-border-subtle, #e2e8f0)",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div style={{ width: "45%", height: 14, borderRadius: 4, background: "#cbd5e1" }} />
            <div style={{ width: "70%", height: 26, borderRadius: 6, background: "#94a3b8" }} />
            <div style={{ width: "35%", height: 10, borderRadius: 4, background: "#e2e8f0" }} />
          </div>
        ))}
      </div>

      {/* Main Grid Skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <div
          style={{
            height: 280,
            borderRadius: 12,
            background: "var(--kx-surface-raised, #f8fafc)",
            border: "1px solid var(--kx-border-subtle, #e2e8f0)",
            padding: 20,
          }}
        >
          <div style={{ width: "30%", height: 18, borderRadius: 4, background: "#cbd5e1", marginBottom: 16 }} />
          <div style={{ width: "100%", height: 180, borderRadius: 8, background: "#f1f5f9" }} />
        </div>
        <div
          style={{
            height: 280,
            borderRadius: 12,
            background: "var(--kx-surface-raised, #f8fafc)",
            border: "1px solid var(--kx-border-subtle, #e2e8f0)",
            padding: 20,
          }}
        >
          <div style={{ width: "40%", height: 18, borderRadius: 4, background: "#cbd5e1", marginBottom: 16 }} />
          <div style={{ width: "100%", height: 45, borderRadius: 6, background: "#f1f5f9", marginBottom: 10 }} />
          <div style={{ width: "100%", height: 45, borderRadius: 6, background: "#f1f5f9", marginBottom: 10 }} />
          <div style={{ width: "100%", height: 45, borderRadius: 6, background: "#f1f5f9" }} />
        </div>
      </div>
    </div>
  );
}
