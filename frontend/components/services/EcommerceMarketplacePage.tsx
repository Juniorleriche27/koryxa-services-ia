import Link from "next/link";
import {
  ArrowRight,
  BadgeDollarSign,
  Boxes,
  CheckCircle2,
  CreditCard,
  PackageCheck,
  ShoppingCart,
  Store,
  Truck,
  UsersRound,
} from "lucide-react";
import type { ServiceDefinition } from "@/lib/services/catalog";

const models = [
  {
    title: "Boutique de marque",
    text: "Vendre directement vos produits avec un catalogue maîtrisé, un tunnel d’achat fluide et une administration simple.",
    icon: Store,
  },
  {
    title: "Commerce B2B",
    text: "Gérer comptes professionnels, tarifs spécifiques, commandes volumineuses, devis et règles commerciales.",
    icon: Boxes,
  },
  {
    title: "Marketplace",
    text: "Accueillir plusieurs vendeurs avec onboarding, commissions, validation des offres et suivi des reversements.",
    icon: UsersRound,
  },
];

const operationalBlocks = [
  { title: "Catalogue", text: "Produits, catégories, variantes, attributs, médias et prix.", icon: Boxes },
  { title: "Paiement", text: "Carte, Mobile Money, virement ou paiement à la livraison.", icon: CreditCard },
  { title: "Commandes", text: "Statuts, factures, retours, remboursements et notifications.", icon: PackageCheck },
  { title: "Livraison", text: "Zones, tarifs, retrait, transporteurs et suivi.", icon: Truck },
  { title: "Pilotage", text: "Ventes, conversion, panier moyen, marge et ruptures.", icon: BadgeDollarSign },
];

export default function EcommerceMarketplacePage({ service }: { service: ServiceDefinition }) {
  return (
    <div className="space-y-24 pb-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-emerald-100 bg-[#fffdf7] px-5 py-10 shadow-[0_30px_90px_rgba(5,46,22,.08)] sm:px-8 sm:py-14 lg:px-14 lg:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(0,168,107,.15),transparent_28%),radial-gradient(circle_at_12%_90%,rgba(16,185,129,.08),transparent_25%)]" />
        <div className="relative grid gap-12 lg:grid-cols-[1.08fr_.92fr] lg:items-center">
          <div>
            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black uppercase tracking-[.18em] text-emerald-800">
              Web & E-commerce · Commerce digital
            </span>
            <h1 className="kx-display mt-6 max-w-4xl text-4xl font-semibold leading-[1.02] tracking-[-.045em] text-slate-950 sm:text-5xl lg:text-7xl">
              Une plateforme de vente pensée pour vos clients et vos opérations.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">{service.tagline}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/services/${service.pillarSlug}/${service.slug}/demande`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#00a86b] px-6 font-black text-white shadow-[0_16px_36px_rgba(0,168,107,.22)] transition hover:bg-emerald-700"
              >
                Lancer mon projet e-commerce <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#modeles" className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 bg-white px-6 font-bold text-slate-800">
                Voir les modèles pris en charge
              </a>
            </div>
          </div>

          <div className="rounded-[2rem] bg-slate-950 p-5 text-white sm:p-7">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[.18em] text-emerald-300">Tunnel commercial</p>
                <p className="mt-1 text-sm text-slate-400">Du produit à la commande confirmée</p>
              </div>
              <ShoppingCart className="h-6 w-6 text-emerald-300" />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ["01", "Découverte", "Recherche, filtres et catégories."],
                ["02", "Décision", "Fiche produit, prix et confiance."],
                ["03", "Paiement", "Panier, livraison et règlement."],
                ["04", "Suivi", "Confirmation, statut et support."],
              ].map(([number, title, text]) => (
                <div key={number} className="rounded-2xl border border-white/10 bg-white/[.05] p-4">
                  <span className="text-xs font-black text-emerald-300">{number}</span>
                  <strong className="mt-5 block text-sm">{title}</strong>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="modeles">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[.2em] text-emerald-700">Modèles commerciaux</p>
          <h2 className="kx-display mt-4 text-3xl font-semibold tracking-[-.035em] text-slate-950 sm:text-4xl">
            Une architecture différente selon qui vend, à qui et comment.
          </h2>
          <p className="mt-4 leading-7 text-slate-600">Nous ne traitons pas une boutique simple comme une marketplace multi-vendeurs ou un portail de commande B2B.</p>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {models.map(({ title, text, icon: Icon }) => (
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
          <p className="text-xs font-black uppercase tracking-[.2em] text-emerald-700">Problèmes traités</p>
          <h2 className="kx-display mt-4 text-3xl font-semibold tracking-[-.035em] text-slate-950 sm:text-4xl">
            La vente en ligne échoue souvent dans les détails opérationnels.
          </h2>
          <p className="mt-4 leading-7 text-slate-600">Nous cadrons le commerce, les équipes, les données et la logistique avant de construire l’interface.</p>
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
        <p className="text-xs font-black uppercase tracking-[.2em] text-emerald-300">Chaîne opérationnelle</p>
        <h2 className="kx-display mt-4 max-w-3xl text-3xl font-semibold tracking-[-.035em] sm:text-4xl">
          Le front-office et le back-office doivent fonctionner comme un seul système.
        </h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {operationalBlocks.map(({ title, text, icon: Icon }) => (
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
          <h2 className="kx-display mt-4 text-3xl font-semibold tracking-[-.035em] text-slate-950">Un périmètre conçu autour du modèle de vente.</h2>
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
          <h2 className="kx-display mt-4 text-3xl font-semibold tracking-[-.035em] text-slate-950">Ce qui est remis à votre équipe.</h2>
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
        <h2 className="kx-display mt-4 max-w-3xl text-3xl font-semibold tracking-[-.035em] text-slate-950 sm:text-4xl">
          Nous testons aussi les scénarios qui se passent mal.
        </h2>
        <p className="mt-4 max-w-3xl leading-7 text-slate-600">Rupture, paiement refusé, remboursement, retard, retour et litige font partie de la conception.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {service.process.map(([number, title, text]) => (
            <article key={number} className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
              <span className="font-black text-emerald-700">{number}</span>
              <h3 className="mt-8 text-xl font-black text-slate-950">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[.75fr_1.25fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-[.2em] text-emerald-700">Questions fréquentes</p>
          <h2 className="kx-display mt-4 text-3xl font-semibold tracking-[-.035em] text-slate-950">Avant de construire votre commerce.</h2>
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
            <p className="text-xs font-black uppercase tracking-[.2em] text-emerald-300">Votre modèle commercial</p>
            <h2 className="kx-display mt-4 text-3xl font-semibold tracking-[-.035em] sm:text-4xl">Décrivons les produits, paiements, stocks et opérations avant de parler technologie.</h2>
            <p className="mt-4 max-w-2xl leading-7 text-slate-300">Le questionnaire dédié prépare un cadrage précis de votre boutique ou marketplace.</p>
          </div>
          <Link href={`/services/${service.pillarSlug}/${service.slug}/demande`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#00a86b] px-6 font-black text-white transition hover:bg-emerald-600">
            Décrire mon projet e-commerce <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
