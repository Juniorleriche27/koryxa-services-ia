import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowRight, Bot, Code2, Globe2, Sparkles, Workflow } from "lucide-react";

import { PillarGrid, PremiumCta, SectionHeading } from "@/components/marketing/ServiceMarketing";

const capabilities = [
  [Globe2, "Web premium", "Sites, commerce et expériences utiles"],
  [Code2, "Produits digitaux", "Applications métier et SaaS"],
  [Bot, "Intelligence IA", "Assistants et agents spécialisés"],
  [Workflow, "Automatisation", "Processus reliés et mesurables"],
] as const;

export default async function HomePage() {
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") || headersList.get("host") || "";
  if (host.startsWith("entreprise.") || host.includes("entreprise.koryxa.fr")) {
    redirect("/espace");
  }

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

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {capabilities.map(([Icon, title, desc]) => (
              <div key={title} className="rounded-3xl border border-emerald-100 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <Icon className="h-6 w-6" />
                </span>
                <strong className="mt-4 block text-base text-slate-950">{title}</strong>
                <p className="mt-1 text-sm leading-6 text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[var(--marketing-max-w)] px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Domaines d'expertise"
          title="Une offre structurée pour concevoir, automatiser et piloter"
          text="Chaque pôle combine design soigné, ingénierie robuste et intégration directe avec vos outils métier."
        />
        <PillarGrid />
        <PremiumCta />
      </div>
    </div>
  );
}
