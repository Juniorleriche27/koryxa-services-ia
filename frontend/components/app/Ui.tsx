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
