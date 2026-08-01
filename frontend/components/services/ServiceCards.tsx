import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { ServiceDefinition } from "@/lib/services/catalog";

export function ServiceCard({ service }: { service: ServiceDefinition }) {
  return <Link href={`/services/${service.pillarSlug}/${service.slug}`} className="group flex h-full flex-col rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,.05)] transition duration-300 hover:-translate-y-1 hover:border-cyan-300 hover:shadow-[0_26px_70px_rgba(0,139,88,.12)]">
    <span className="text-xs font-bold uppercase tracking-[.18em] text-cyan-700">{service.pillarTitle}</span>
    <h3 className="mt-5 text-xl font-semibold tracking-[-.03em] text-slate-950">{service.title}</h3>
    <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{service.summary}</p>
    <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-cyan-700">Voir le service <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
  </Link>;
}

export function FeatureList({ items }: { items: string[] }) {
  return <ul className="grid gap-3 sm:grid-cols-2">{items.map(item => <li key={item} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium leading-6 text-slate-700"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-cyan-600" />{item}</li>)}</ul>;
}
