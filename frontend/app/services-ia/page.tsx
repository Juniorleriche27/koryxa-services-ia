import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { SERVICE_IA_BLOCKS, SERVICE_IA_ITEMS, SERVICE_IA_MARKETING_POINTS } from "./data";

export const metadata: Metadata = {
  title: "Service IA | KORYXA",
  description:
    "Service IA: le studio d'exécution KORYXA transforme vos besoins métier en projets livrés. 10 offres IA pour accélérer votre transformation digitale.",
};

const BLOCK_STYLES = {
  revenu: "from-emerald-950/40 to-emerald-900/20 border-emerald-500/20",
  productivite: "from-sky-950/40 to-cyan-900/20 border-sky-500/20",
  digital: "from-violet-950/40 to-fuchsia-900/20 border-violet-500/20",
} as const;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Service IA",
  description: "Studio d'exécution KORYXA pour transformer les besoins métier en projets livrés",
  provider: {
    "@type": "Organization",
    name: "KORYXA",
  },
  serviceArea: "FR",
  areaServed: "FR",
};

export default function ServicesIaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="relative space-y-10 bg-[#020617] pb-16">
        <section className="kx-reveal-up relative overflow-hidden rounded-[32px] border border-slate-200/80 bg-[linear-gradient(145deg,#0e172f_0%,#112548_55%,#14345f_100%)] px-6 py-12 text-white shadow-[0_24px_72px_rgba(15,23,42,0.26)] sm:px-10 sm:py-14">
          <div aria-hidden className="kx-animated-grid absolute inset-0 opacity-20" />
          <div aria-hidden className="kx-orb kx-orb-a opacity-40" />
          <div aria-hidden className="kx-orb kx-orb-b opacity-32" />
          <div
            aria-hidden
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, rgba(148,180,220,0.2) 1px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
          />
          <div aria-hidden className="absolute -right-16 top-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.2),transparent_65%)]" />

          <div className="relative mx-auto max-w-4xl">
            <div className="kx-hero-badge-pulse inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
              <Sparkles className="h-4 w-4" />
              Studio d'execution
            </div>
            <h1 className="kx-display kx-shimmer-line mt-6 text-[2.2rem] font-semibold leading-[1] tracking-[-0.06em] text-white sm:text-[3.25rem]">
              Service IA: vos projets
              <span className="kx-title-gradient-loop block">executes de bout en bout.</span>
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
              Vous deposez un besoin. KORYXA le qualifie, chiffre un devis, constitue l'equipe et livre.
              Objectif: produire un resultat metier mesurable, pas une promesse vague.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {SERVICE_IA_MARKETING_POINTS.map((item) => (
                <div
                  key={item.label}
                  className="kx-kpi-card-glow rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-200">{item.label}</p>
                  <p className="mt-2 text-base font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-4 sm:px-6 lg:px-8">
          <div className="kx-stagger mx-auto grid gap-6" style={{ maxWidth: "var(--marketing-max-w)" }}>
            {SERVICE_IA_BLOCKS.map((block) => {
              const services = SERVICE_IA_ITEMS.filter((item) => item.block === block.id);
              return (
                <article key={block.id} className="kx-hover-lift rounded-[30px] kx-glow-card p-6 sm:p-8">
                  <div className={`rounded-2xl border bg-gradient-to-r px-5 py-4 ${BLOCK_STYLES[block.id]}`}>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{block.title}</p>
                    <p className="mt-2 text-sm text-slate-300">{block.subtitle}</p>
                  </div>

                  <div className="kx-stagger mt-5 grid gap-4 lg:grid-cols-3">
                    {services.map((service) => (
                      <div key={service.slug} className="kx-kpi-card-glow kx-hover-lift flex h-full flex-col rounded-2xl kx-glow-card p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-400">{service.shortLabel}</p>
                        <h2 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">{service.title}</h2>
                        <p className="mt-3 flex-1 text-sm leading-7 text-slate-300">{service.summary}</p>
                        <ul className="mt-4 space-y-2">
                          {service.outcomes.map((outcome) => (
                            <li key={outcome} className="flex items-start gap-2 text-sm text-slate-300">
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                              {outcome}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-5 flex flex-wrap gap-2">
                          <Link
                            href={`/services-ia/${service.slug}`}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-500 bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-400 hover:text-sky-300"
                          >
                            Voir le service
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                          <Link
                            href={`/services-ia/demande?service=${service.slug}`}
                            className="kx-cta-glow inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-500"
                          >
                            Lancer le brief
                            <ArrowRight className="kx-arrow-bounce h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
}
