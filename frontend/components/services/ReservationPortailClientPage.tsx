import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CalendarCheck2,
  CheckCircle2,
  CreditCard,
  FileLock2,
  KeyRound,
  LayoutDashboard,
  RefreshCcw,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import type { ServiceDefinition } from "@/lib/services/catalog";

const useCases = [
  { title: "Rendez-vous", text: "Réserver un créneau selon les disponibilités d’un collaborateur, d’un lieu ou d’une ressource.", icon: CalendarCheck2 },
  { title: "Portail client", text: "Retrouver ses réservations, documents, factures, statuts et prochaines actions dans un espace sécurisé.", icon: LayoutDashboard },
  { title: "Dossier suivi", text: "Déposer des informations, recevoir des demandes complémentaires et suivre l’avancement d’un dossier.", icon: FileLock2 },
];

const systemBlocks = [
  { title: "Disponibilités", text: "Horaires, durées, capacités, temps tampon et exceptions.", icon: CalendarCheck2 },
  { title: "Paiements", text: "Acompte, solde, remboursement et paiement sur place.", icon: CreditCard },
  { title: "Notifications", text: "Confirmation, rappel, annulation et relance.", icon: BellRing },
  { title: "Accès", text: "Comptes, rôles, permissions et journal d’activité.", icon: KeyRound },
  { title: "Opérations", text: "Back-office, statuts, documents et indicateurs.", icon: UsersRound },
];

export default function ReservationPortailClientPage({ service }: { service: ServiceDefinition }) {
  return (
    <div className="space-y-24 pb-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-emerald-100 bg-[#fffdf7] px-5 py-10 shadow-[0_30px_90px_rgba(5,46,22,.08)] sm:px-8 sm:py-14 lg:px-14 lg:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_84%_14%,rgba(0,168,107,.15),transparent_28%),radial-gradient(circle_at_12%_88%,rgba(16,185,129,.08),transparent_24%)]" />
        <div className="relative grid gap-12 lg:grid-cols-[1.08fr_.92fr] lg:items-center">
          <div>
            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black uppercase tracking-[.18em] text-emerald-800">
              Web & E-commerce · Réservation et espace client
            </span>
            <h1 className="kx-display mt-6 max-w-4xl text-4xl font-semibold leading-[1.02] tracking-[-.045em] text-slate-950 sm:text-5xl lg:text-7xl">
              Vos clients réservent et suivent leurs démarches sans dépendre de votre équipe.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">{service.tagline}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={`/services/${service.pillarSlug}/${service.slug}/demande`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#00a86b] px-6 font-black text-white shadow-[0_16px_36px_rgba(0,168,107,.22)] transition hover:bg-emerald-700">
                Cadrer mon portail <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#cas-usage" className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 bg-white px-6 font-bold text-slate-800">Voir les cas d’usage</a>
            </div>
          </div>

          <div className="rounded-[2rem] bg-slate-950 p-5 text-white sm:p-7">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[.18em] text-emerald-300">Parcours client</p>
                <p className="mt-1 text-sm text-slate-400">Réserver, payer, suivre, retrouver</p>
              </div>
              <RefreshCcw className="h-6 w-6 text-emerald-300" />
            </div>
            <div className="mt-5 space-y-3">
              {[
                ["01", "Choisir", "Service, lieu, ressource ou intervenant."],
                ["02", "Réserver", "Créneau fiable selon les règles réelles."],
                ["03", "Confirmer", "Paiement, consentement et notifications."],
                ["04", "Suivre", "Historique, documents et prochaines actions."],
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

      <section id="cas-usage">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[.2em] text-emerald-700">Cas d’usage</p>
          <h2 className="kx-display mt-4 text-3xl font-semibold tracking-[-.035em] text-slate-950 sm:text-4xl">Le portail dépend de ce que le client doit accomplir seul.</h2>
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

      <section className="grid gap-10 lg:grid-cols-[.82fr_1.18fr] lg:items-start">
        <div className="lg:sticky lg:top-28">
          <p className="text-xs font-black uppercase tracking-[.2em] text-emerald-700">Frictions opérationnelles</p>
          <h2 className="kx-display mt-4 text-3xl font-semibold tracking-[-.035em] text-slate-950 sm:text-4xl">Une réservation simple en apparence cache souvent de nombreuses règles.</h2>
          <p className="mt-4 leading-7 text-slate-600">Nous modélisons les disponibilités, exceptions, droits et responsabilités avant de développer l’interface.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {service.problems.map((problem) => (
            <div key={problem} className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-semibold leading-6 text-slate-700">
              <span className="mb-4 block h-2 w-10 rounded-full bg-emerald-500" />{problem}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] bg-slate-950 p-6 text-white sm:p-10">
        <p className="text-xs font-black uppercase tracking-[.2em] text-emerald-300">Système complet</p>
        <h2 className="kx-display mt-4 max-w-3xl text-3xl font-semibold tracking-[-.035em] sm:text-4xl">Le calendrier n’est qu’une partie du produit.</h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {systemBlocks.map(({ title, text, icon: Icon }) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/[.05] p-5">
              <Icon className="h-5 w-5 text-emerald-300" />
              <strong className="mt-5 block text-sm">{title}</strong>
              <p className="mt-2 text-xs leading-5 text-slate-400">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-2">
        <div>
          <p className="text-xs font-black uppercase tracking-[.2em] text-emerald-700">Fonctionnalités</p>
          <h2 className="kx-display mt-4 text-3xl font-semibold tracking-[-.035em] text-slate-950">Un périmètre adapté à vos opérations.</h2>
          <div className="mt-7 grid gap-3">
            {service.features.map((feature) => (
              <div key={feature} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold leading-6 text-slate-700">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />{feature}
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[.2em] text-emerald-700">Livrables</p>
          <h2 className="kx-display mt-4 text-3xl font-semibold tracking-[-.035em] text-slate-950">Ce que votre organisation reçoit.</h2>
          <div className="mt-7 rounded-[2rem] border border-emerald-100 bg-emerald-50/60 p-6 sm:p-8">
            <ol className="space-y-5">
              {service.deliverables.map((item, index) => (
                <li key={item} className="flex gap-4 border-b border-emerald-100 pb-5 last:border-0 last:pb-0">
                  <span className="font-black text-emerald-700">{String(index + 1).padStart(2, "0")}</span>
                  <span className="text-sm font-semibold leading-6 text-slate-700">{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section>
        <p className="text-xs font-black uppercase tracking-[.2em] text-emerald-700">Méthode</p>
        <h2 className="kx-display mt-4 max-w-3xl text-3xl font-semibold tracking-[-.035em] text-slate-950 sm:text-4xl">Nous testons les exceptions autant que le parcours idéal.</h2>
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
        <div className="grid gap-8 lg:grid-cols-[1fr_.95fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[.2em] text-emerald-800">Sécurité et contrôle</p>
            <h2 className="kx-display mt-4 text-3xl font-semibold tracking-[-.035em] text-slate-950 sm:text-4xl">Chaque profil ne voit que ce qu’il doit voir.</h2>
            <p className="mt-4 leading-7 text-slate-600">Clients, collaborateurs, partenaires et administrateurs ont des droits distincts, avec journalisation des actions sensibles.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Authentification", "Accès sécurisé et récupération maîtrisée."],
              ["Permissions", "Droits selon le rôle et le dossier."],
              ["Documents", "Accès contrôlé et conservation définie."],
              ["Traçabilité", "Historique des changements importants."],
            ].map(([title, text]) => (
              <div key={title} className="rounded-2xl border border-emerald-100 bg-white p-5">
                <ShieldCheck className="h-5 w-5 text-emerald-700" />
                <strong className="mt-5 block text-sm text-slate-950">{title}</strong>
                <p className="mt-2 text-xs leading-5 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[.75fr_1.25fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-[.2em] text-emerald-700">Questions fréquentes</p>
          <h2 className="kx-display mt-4 text-3xl font-semibold tracking-[-.035em] text-slate-950">Avant de modéliser les règles.</h2>
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
            <p className="text-xs font-black uppercase tracking-[.2em] text-emerald-300">Votre fonctionnement</p>
            <h2 className="kx-display mt-4 text-3xl font-semibold tracking-[-.035em] sm:text-4xl">Commençons par vos règles de réservation et de suivi client.</h2>
            <p className="mt-4 max-w-2xl leading-7 text-slate-300">Le questionnaire dédié prépare les profils, ressources, paiements, notifications, documents et intégrations nécessaires.</p>
          </div>
          <Link href={`/services/${service.pillarSlug}/${service.slug}/demande`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#00a86b] px-6 font-black text-white transition hover:bg-emerald-600">
            Décrire mon portail <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
