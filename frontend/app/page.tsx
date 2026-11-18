import Link from "next/link";
import {
  Briefcase,
  ShoppingBag,
  Wallet,
  SlidersHorizontal,
  Users,
  ShieldCheck,
  ArrowUpRight,
  Mic,
  MessageSquare,
  Lock,
} from "lucide-react";

const DEPARTMENTS_DATA = [
  {
    num: "01",
    id: "direction",
    title: "Direction",
    badge: "Arbitrage & Stratégie",
    desc: "Piloter les décisions et les actions stratégiques.",
    href: "/espace/actions",
    icon: Briefcase,
  },
  {
    num: "02",
    id: "commerce",
    title: "Commerce",
    badge: "Ventes · POS Caisse",
    desc: "Développer les ventes, facturation vocale et suivi client.",
    href: "/espace/ventes",
    icon: ShoppingBag,
  },
  {
    num: "03",
    id: "finances",
    title: "Finances",
    badge: "Caisse & Trésorerie",
    desc: "Suivre les mouvements, la trésorerie et les dépenses réelles.",
    href: "/espace/finance",
    icon: Wallet,
  },
  {
    num: "04",
    id: "operations",
    title: "Opérations",
    badge: "Stocks & Procédures",
    desc: "Suivre les stocks, les procédures et les processus métier.",
    href: "/espace/procedures",
    icon: SlidersHorizontal,
  },
  {
    num: "05",
    id: "organisation",
    title: "Membres et organisation",
    badge: "Équipe & Présences",
    desc: "Gérer les équipes, les présences et la structure de l’entreprise.",
    href: "/espace/equipe",
    icon: Users,
  },
  {
    num: "06",
    id: "radar",
    title: "Radar et contrôle",
    badge: "Audit SHA-256",
    desc: "Identifier les risques, les alertes et les validations Four-Eyes.",
    href: "/espace/radar",
    icon: ShieldCheck,
  },
] as const;

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen lg:h-screen lg:overflow-hidden flex-col justify-between bg-[#f4f7f5] text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 px-4 py-4 sm:px-6 sm:py-5 lg:px-10 lg:py-6">
      {/* Background subtle radial accents */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-green-200/30 blur-3xl" />

      {/* 1. Header Sobre — Style Grand Siège (Aéré et équilibré) */}
      <header className="relative z-10 mx-auto flex w-full max-w-[1360px] flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-900/10 bg-white/95 px-5 py-3 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-800 text-white font-bold tracking-tight shadow-sm text-base">
            CA
          </div>
          <div>
            <span className="flex items-center gap-2.5">
              <strong className="text-lg font-bold tracking-tight text-slate-950">CAURI</strong>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                Grand Siège
              </span>
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-xs font-medium text-slate-600">
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
            <Lock className="h-3.5 w-3.5 text-emerald-700" />
            Certifié SHA-256
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Direct · Synchronisé
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/espace/ventes"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-800 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          >
            Ouvrir la caisse & ventes
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* 2. Titre Institutionnel Agrandie et Lisible */}
      <section className="relative z-10 my-auto w-full py-4 text-center">
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">
          <span className="h-2 w-2 rounded-full bg-emerald-700" />
          Centre de commandement & pilotage
        </span>
        <h1 className="mt-2.5 text-balance font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-950 leading-[1.15]">
          Le Cœur Stratégique de votre Organisation
        </h1>
        <p className="mx-auto mt-2 max-w-3xl text-balance text-sm sm:text-base text-slate-600 leading-relaxed">
          Six départements unifiés sous une seule direction. Pilotez vos flux financiers, encaissez sur le terrain et arbitrez les décisions avec précision.
        </p>

        {/* 3. La Grille des 6 Départements (Spacieuse et mise en valeur) */}
        <div className="mx-auto mt-6 lg:mt-8 grid max-w-[1360px] gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {DEPARTMENTS_DATA.map((dep) => {
            const Icon = dep.icon;
            return (
              <Link
                key={dep.id}
                href={dep.href}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-emerald-600/50 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <span className="text-xs sm:text-sm font-bold text-slate-400 group-hover:text-emerald-700 transition">
                      {dep.num} {dep.title}
                    </span>
                    <span className="inline-flex items-center rounded-lg border border-emerald-200/70 bg-emerald-50/80 px-2.5 py-1 text-xs font-semibold text-emerald-900">
                      {dep.badge}
                    </span>
                  </div>

                  <div className="mt-4 flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-200/80 bg-emerald-50 text-emerald-800 transition group-hover:bg-emerald-800 group-hover:text-white">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <strong className="block text-base sm:text-lg font-bold text-slate-950 group-hover:text-emerald-950">
                        {dep.title}
                      </strong>
                      <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-600">
                        {dep.desc}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between pt-3.5 border-t border-slate-100 text-xs sm:text-sm font-bold text-emerald-800">
                  <span>Accéder à l’espace</span>
                  <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. Barre Inférieure Sobre & Spacieuse */}
      <footer className="relative z-10 mx-auto flex w-full max-w-[1360px] flex-wrap items-center justify-between gap-3 border-t border-slate-200/90 pt-3 text-xs sm:text-sm text-slate-500">
        <div className="flex flex-wrap items-center gap-5">
          <span className="inline-flex items-center gap-2 font-medium text-slate-700">
            <Mic className="h-4 w-4 text-emerald-700" />
            Capture vocale & WhatsApp
          </span>
          <span className="hidden sm:inline-flex items-center gap-2 font-medium text-slate-700">
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
            Visas Four-Eyes & Anti-fraude
          </span>
          <span className="hidden md:inline-flex items-center gap-2 font-medium text-slate-700">
            <MessageSquare className="h-4 w-4 text-emerald-700" />
            Conseiller Cora IA intégré
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span>© CAURI — Le siège de votre entreprise</span>
          <Link href="/espace/actions" className="font-bold text-emerald-800 hover:underline">
            Direction & Pilotage →
          </Link>
        </div>
      </footer>
    </div>
  );
}
