import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight, Bot, BriefcaseBusiness, Building2, CheckCircle2, CloudCog,
  Code2, Database, Gauge, Globe2, Layers3, Network, Rocket, ShieldCheck,
  ShoppingBag, Sparkles, Workflow, Wrench
} from "lucide-react";

export const pillars = [
  { slug: "web-ecommerce", title: "Web & E-commerce", description: "Sites premium, boutiques, plateformes de réservation et expériences digitales performantes.", icon: Globe2 },
  { slug: "applications-saas", title: "Applications & SaaS", description: "Applications métier, MVP, portails privés et produits SaaS fiables et évolutifs.", icon: Code2 },
  { slug: "intelligence-artificielle", title: "Intelligence artificielle", description: "Assistants, agents, chatbots, systèmes documentaires et solutions IA spécialisées.", icon: Bot },
  { slug: "automatisation-integrations", title: "Automatisation & Intégrations", description: "Workflows, connecteurs et automatisations qui réduisent les tâches répétitives.", icon: Workflow },
  { slug: "data-infrastructure", title: "Data & Infrastructure", description: "Données, tableaux de bord, cloud, sécurité, performance et déploiement.", icon: Database },
  { slug: "conseil-maintenance-formation", title: "Conseil, maintenance & formation", description: "Audit, stratégie, support, maintenance continue et montée en compétence des équipes.", icon: Wrench },
] as const;

export const navItems = [
  { href: "/services", label: "Services" },
  { href: "/solutions", label: "Solutions" },
  { href: "/methode", label: "Méthode" },
  { href: "/realisations", label: "Réalisations" },
  { href: "/a-propos", label: "À propos" },
  { href: "/contact", label: "Contact" },
] as const;

export const iconMap: Record<string, LucideIcon> = { Globe2, Code2, Bot, Workflow, Database, Wrench, Rocket, ShieldCheck, Gauge, CloudCog, Network, Layers3, ShoppingBag, Sparkles, Building2, BriefcaseBusiness };

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-cyan-800"><Sparkles className="h-3.5 w-3.5" />{children}</span>;
}

export function SectionHeading({ eyebrow, title, text, align = "left" }: { eyebrow: string; title: string; text?: string; align?: "left" | "center" }) {
  return <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
    <Eyebrow>{eyebrow}</Eyebrow>
    <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl lg:text-5xl">{title}</h2>
    {text ? <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">{text}</p> : null}
  </div>;
}

export function PillarGrid() {
  return <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{pillars.map(({ slug, title, description, icon: Icon }, index) => (
    <Link key={slug} href={`/services#${slug}`} className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:border-cyan-300 hover:shadow-[0_28px_70px_rgba(8,145,178,0.14)] sm:p-7">
      <div className="flex items-start justify-between gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-cyan-300"><Icon className="h-5 w-5" /></span><span className="text-xs font-bold text-slate-300">0{index + 1}</span></div>
      <h3 className="mt-8 text-xl font-semibold tracking-[-0.03em] text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
      <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-cyan-700">Explorer <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
    </Link>
  ))}</div>;
}

export function PremiumCta({ title = "Transformons votre idée en système utile.", text = "Parlez-nous de votre besoin. Nous vous aidons à cadrer la bonne solution avant de construire." }: { title?: string; text?: string }) {
  return <section className="overflow-hidden rounded-[2rem] bg-slate-950 px-5 py-10 text-white shadow-[0_30px_90px_rgba(2,8,23,0.28)] sm:px-8 sm:py-14 lg:px-14">
    <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">KORYXA Service IA & Web</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">{title}</h2><p className="mt-4 leading-7 text-slate-300">{text}</p></div><Link href="/demarrer-un-projet" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-cyan-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-300">Démarrer un projet <ArrowRight className="h-4 w-4" /></Link></div>
  </section>;
}

export function CheckList({ items }: { items: string[] }) {
  return <ul className="grid gap-3 sm:grid-cols-2">{items.map((item) => <li key={item} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />{item}</li>)}</ul>;
}
