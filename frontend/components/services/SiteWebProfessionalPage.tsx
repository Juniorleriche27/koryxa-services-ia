import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Gauge,
  MessageCircle,
  MonitorSmartphone,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import type { ServiceDefinition } from "@/lib/services/catalog";

const useCases = [
  {
    title: "Entreprise de services",
    text: "Présenter les expertises, rassurer avec des références et orienter chaque visiteur vers la bonne demande.",
    icon: UsersRound,
  },
  {
    title: "Activité locale",
    text: "Rendre l’offre immédiatement compréhensible, faciliter l’appel, WhatsApp, le devis ou la prise de rendez-vous.",
    icon: MessageCircle,
  },
  {
    title: "Nouvelle marque",
    text: "Installer un positionnement crédible dès le lancement avec une identité, un message et une présence digitale cohérente.",
    icon: Sparkles,
  },
];

const successSignals = [
  { label: "Compréhension", value: "Votre activité est comprise en quelques secondes", icon: SearchCheck },
  { label: "Mobile", value: "Le parcours reste fluide sur téléphone", icon: MonitorSmartphone },
  { label: "Performance", value: "Les pages chargent rapidement", icon: Gauge },
  { label: "Conversion", value: "Les appels à l’action sont visibles et mesurables", icon: BarChart3 },
  { label: "Confiance", value: "Les preuves, mentions et contacts rassurent", icon: ShieldCheck },
];

export default function SiteWebProfessionalPage({ service }: { service: ServiceDefinition }) {
  return (
    <div className="space-y-24 pb-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-emerald-100 bg-[#fffdf7] px-5 py-10 shadow-[0_30px_90px_rgba(5,46,22,.08)] sm:px-8 sm:py-14 lg:px-14 lg:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(0,168,107,.14),transparent_30%),radial-gradient(circle_at_10%_90%,rgba(16,185,129,.08),transparent_26%)]" />
        <div className="relative grid gap-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div>
            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black uppercase tracking-[.18em] text-emerald-800">
              Web & E-commerce · Site vitrine sur mesure
            </span>
            <h1 className="kx-display mt-6 max-w-4xl text-4xl font-semibold leading-[1.02] tracking-[-.045em] text-slate-950 sm:text-5xl lg:text-7xl">
              Votre entreprise mérite un site à la hauteur de son travail.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">{service.tagline}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/services/${service.pillarSlug}/${service.slug}/demande`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#00a86b] px-6 font-black text-white shadow-[0_16px_36px_rgba(0,168,107,.22)] transition hover:bg-emerald-700"
              >
                Créer mon site professionnel <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#contenu" className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 bg-white px-6 font-bold text-slate-800">
                Découvrir la prestation
              </a>
            </div>
          </div>
          <div className="rounded-[2rem] bg-slate-950 p-5 text-white sm:p-7">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[.18em] text-emerald-300">Parcours du visiteur</p>
                <p className="mt-1 text-sm text-slate-400">Comprendre → croire → agir</p>
              </div>
              <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,.8)]" />
            </div>
            <div className="mt-5 space-y-3">
              {[
                ["01", "Comprendre votre activité", "Une promesse claire, sans jargon."],
                ["02", "Évaluer votre crédibilité", "Réalisations, méthode, équipe et preuves."],
                ["03", "Choisir la bonne action", "Devis, appel, WhatsApp ou rendez-vous."],
              ].map(([number, title, text]) => (
                <div key={number} className="rounded-2xl border border-white/10 bg-white/[.05] p-4">
                  <div className="flex gap-4">
                    <span className="font-black text-emerald-300">{number}</span>
                    <div><strong className="text-sm">{title}</strong><p className="mt-1 text-xs leading-5 text-slate-400">{text}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="contenu" className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
        <div className="lg:sticky lg:top-28">
          <p className="text-xs font-black uppercase tracking-[.2em] text-emerald-700">Ce que nous corrigeons</p>
          <h2 className="kx-display mt-4 text-3xl font-semibold tracking-[-.035em] text-slate-950 sm:text-4xl">Un beau site ne suffit pas. Il doit expliquer, rassurer et convertir.</h2>
          <p className="mt-4 leading-7 text-slate-600">Nous partons de la réalité commerciale de votre entreprise, pas d’un modèle générique.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {service.problems.map((problem) => (
            <div key={problem} className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-semibold leading-6 text-slate-700">
              <span className="mb-4 block h-2 w-10 rounded-full bg-emerald-500" />{problem}
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[.2em] text-emerald-700">Situations courantes</p>
          <h2 className="kx-display mt-4 text-3xl font-semibold tracking-[-.035em] text-slate-950 sm:text-4xl">Un site différent selon la manière dont votre entreprise vend.</h2>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {useCases.map(({ title, text, icon: Icon }) => (
            <article key={title} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><Icon className="h-5 w-5" /></span>
              <h3 className="mt-8 text-xl font-black text-slate-950">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-2">
        <div>
          <p className="text-xs font-black uppercase tracking-[.2em] text-emerald-700">Périmètre possible</p>
          <h2 className="kx-display mt-4 text-3xl font-semibold tracking-[-.035em] text-slate-950">Ce que le site peut intégrer.</h2>
          <div className="mt-7 grid gap-3">
            {service.features.map((feature) => (
              <div key={feature} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold leading-6 text-slate-700">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />{feature}
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[.2em] text-emerald-700">Livraison</p>
          <h2 className="kx-display mt-4 text-3xl font-semibold tracking-[-.035em] text-slate-950">Ce que vous recevez concrètement.</h2>
          <div className="mt-7 rounded-[2rem] bg-slate-950 p-6 text-white sm:p-8">
            <ol className="space-y-5">
              {service.deliverables.map((item, index) => (
                <li key={item} className="flex gap-4 border-b border-white/10 pb-5 last:border-0 last:pb-0">
                  <span className="font-black text-emerald-300">{String(index + 1).padStart(2, "0")}</span>
                  <span className="text-sm leading-6 text-slate-200">{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section>
        <p className="text-xs font-black uppercase tracking-[.2em] text-emerald-700">Méthode de production</p>
        <h2 className="kx-display mt-4 max-w-3xl text-3xl font-semibold tracking-[-.035em] text-slate-950 sm:text-4xl">Le contenu et le parcours sont décidés avant le développement.</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {service.process.map(([number, title, text]) => (
            <article key={number} className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
              <span className="font-black text-emerald-700">{number}</span>
              <h3 className="mt-8 text-xl font-black text-slate-950">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-emerald-100 bg-emerald-50/60 p-6 sm:p-10">
        <p className="text-xs font-black uppercase tracking-[.2em] text-emerald-800">Critères de réussite</p>
        <h2 className="kx-display mt-4 text-3xl font-semibold tracking-[-.035em] text-slate-950">Comment nous évaluons la qualité du résultat.</h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {successSignals.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-emerald-100 bg-white p-5">
              <Icon className="h-5 w-5 text-emerald-700" />
              <strong className="mt-5 block text-sm text-slate-950">{label}</strong>
              <p className="mt-2 text-xs leading-5 text-slate-600">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[.75fr_1.25fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-[.2em] text-emerald-700">Questions fréquentes</p>
          <h2 className="kx-display mt-4 text-3xl font-semibold tracking-[-.035em] text-slate-950">Avant de démarrer.</h2>
        </div>
        <div className="grid gap-3">
          {service.faqs.map(([question, answer]) => (
            <details key={question} className="rounded-2xl border border-slate-200 bg-white p-5">
              <summary className="cursor-pointer list-none font-black text-slate-950">{question}</summary>
              <p className="mt-3 text-sm leading-6 text-slate-600">{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] bg-slate-950 px-6 py-10 text-white sm:px-10 lg:px-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[.2em] text-emerald-300">Votre futur site</p>
            <h2 className="kx-display mt-4 text-3xl font-semibold tracking-[-.035em] sm:text-4xl">Commençons par comprendre ce que votre site doit accomplir.</h2>
            <p className="mt-4 max-w-2xl leading-7 text-slate-300">Le questionnaire dédié nous permet de préparer un premier cadrage autour de votre activité, vos contenus, vos cibles et vos objectifs.</p>
          </div>
          <Link href={`/services/${service.pillarSlug}/${service.slug}/demande`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#00a86b] px-6 font-black text-white transition hover:bg-emerald-600">
            Remplir le questionnaire <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
