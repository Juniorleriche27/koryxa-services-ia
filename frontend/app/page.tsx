import Link from "next/link";
import { ArrowRight, Bot, Code2, Globe2, Sparkles, Workflow } from "lucide-react";

import { PillarGrid, PremiumCta, SectionHeading } from "@/components/marketing/ServiceMarketing";

const capabilities = [
  [Globe2, "Web premium", "Sites, commerce et expériences utiles"],
  [Code2, "Produits digitaux", "Applications métier et SaaS"],
  [Bot, "Intelligence IA", "Assistants et agents spécialisés"],
  [Workflow, "Automatisation", "Processus reliés et mesurables"],
] as const;

export default function HomePage() {
  return (
    <div className="pb-12">
      <section className="relative overflow-hidden border-b border-emerald-100 bg-white">
        <div className="kx-noise absolute inset-0 opacity-35" />
        <div className="absolute -left-32 top-12 h-80 w-80 rounded-full bg-emerald-100/70 blur-3xl" />
        <div className="absolute right-[-8rem] top-[-6rem] h-[34rem] w-[34rem] rounded-full bg-green-100/80 blur-3xl" />
        <div className="relative mx-auto w-full max-w-[var(--marketing-max-w)] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
            <span className="kx-reveal kx-reveal-1 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[.18em] text-emerald-700 shadow-sm">
              <Sparkles className="h-4 w-4" /> Studio numérique KORYXA
            </span>
            <h1 className="kx-reveal kx-reveal-2 mt-7 max-w-6xl text-balance text-[clamp(3rem,5.4vw,6rem)] font-semibold leading-[.96] tracking-[-.05em] text-[var(--kx-text)]">
              Le web, l’IA et l’automatisation réunis pour faire avancer votre entreprise.
            </h1>
            <p className="kx-reveal kx-reveal-3 mt-7 max-w-3xl text-balance text-lg leading-8 text-[var(--kx-muted)] sm:text-xl">
              Nous concevons des expériences numériques premium, des applications utiles et des systèmes intelligents adaptés à vos opérations.
            </p>
            <div className="kx-reveal kx-reveal-4 mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/demarrer-un-projet" className="kx-shimmer inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-[#00a86b] px-7 font-bold text-white shadow-[0_16px_38px_rgba(0,168,107,.25)] transition hover:-translate-y-1 hover:bg-[#16bc79]">
                Parler de mon projet <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/services" className="inline-flex min-h-13 items-center justify-center rounded-full border border-emerald-200 bg-white px-7 font-bold text-emerald-800 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md">
                Explorer les services
              </Link>
            </div>
          </div>

          <div className="relative mx-auto mt-16 max-w-6xl">
            <div className="kx-orbit left-[8%] top-[5%] h-72 w-72" />
            <div className="kx-orbit bottom-[-8%] right-[4%] h-80 w-80 [animation-direction:reverse]" />
            <div className="relative rounded-[2rem] border border-emerald-100 bg-white/95 p-6 text-center shadow-[0_30px_80px_rgba(0,168,107,.14)] backdrop-blur sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-600">KORYXA System</p>
              <h2 className="mx-auto mt-3 max-w-3xl text-balance text-3xl font-semibold tracking-[-.035em] text-[var(--kx-text)] sm:text-4xl">Un projet orchestré, pas une accumulation d’outils.</h2>
              <p className="mx-auto mt-3 max-w-2xl text-balance leading-7 text-[var(--kx-muted)]">Stratégie, design, technologie et accompagnement réunis dans un même système.</p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {capabilities.map(([Icon, title, text], index) => (
                  <article key={title} className={`kx-card kx-reveal kx-reveal-${index + 1} flex min-h-56 flex-col items-center rounded-[1.5rem] p-5 text-center`}>
                    <div className="flex w-full items-start justify-between gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><Icon className="h-5 w-5" /></span>
                      <span className="text-xs font-bold text-emerald-600">0{index + 1}</span>
                    </div>
                    <h3 className="mt-6 text-balance text-xl font-semibold text-[var(--kx-text)]">{title}</h3>
                    <p className="mt-2 text-balance text-sm leading-6 text-[var(--kx-muted)]">{text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto w-full max-w-[var(--marketing-max-w)] px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <SectionHeading eyebrow="Nos expertises" title="Six pôles reliés par une même exigence." text="Chaque pôle possède ses propres méthodes, ses propres outils et ses propres livrables — avec un niveau de qualité commun." />
        <PillarGrid />
      </section>
      <section className="mx-auto w-full max-w-[var(--marketing-max-w)] px-4 pb-12 sm:px-6 lg:px-8"><PremiumCta /></section>
    </div>
  );
}
