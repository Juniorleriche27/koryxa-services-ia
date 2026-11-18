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
    <div className="relative flex min-h-screen lg:h-screen lg:overflow-hidden flex-col justify-between bg-[#f4f7f5] text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 px-4 py-3 sm:px-6 sm:py-4 lg:px-8 lg:py-5">
      {/* Background subtle radial accents */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-green-200/30 blur-3xl" />

      {/* 1. Header Sobre — Style Grand Siège */}
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-900/10 bg-white/90 px-4 py-2.5 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-800 text-white font-bold tracking-tight shadow-sm text-sm">
            CA
          </div>
          <div>
            <span className="flex items-center gap-2">
              <strong className="text-sm font-bold tracking-tight text-slate-900">CAURI</strong>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Grand Siège
              </span>
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-600">
          <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1">
            <Lock className="h-3 w-3 text-emerald-700" />
            Certifié SHA-256
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Direct · Synchronisé
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/espace"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-emerald-800 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          >
            Accéder à l’espace
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* 2. Titre Institutionnel Compact */}
      <section className="relative z-10 my-auto py-2 text-center">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-emerald-800">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-700" />
          Centre de commandement & pilotage
        </span>
        <h1 className="mt-1.5 text-balance font-[family-name:var(--font-playfair)] text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl lg:text-[2.25rem] lg:leading-tight">
          Le Cœur Stratégique de votre Organisation
        </h1>
        <p className="mx-auto mt-1 max-w-2xl text-balance text-xs text-slate-600 sm:text-sm">
          Six départements unifiés sous une seule direction. Pilotez vos flux financiers, encaissez sur le terrain et arbitrez les décisions avec précision.
        </p>

        {/* 3. La Grille des 6 Départements (3 cols x 2 rows sur desktop, 1 col sur mobile) */}
        <div className="mx-auto mt-4 grid max-w-5xl gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {DEPARTMENTS_DATA.map((dep) => {
            const Icon = dep.icon;
            return (
              <Link
                key={dep.id}
                href={dep.href}
                className="group relative flex flex-col justify-between rounded-xl border border-emerald-950/10 bg-white p-3.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-600/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <span className="text-[11px] font-bold text-slate-400 group-hover:text-emerald-700 transition">
                      {dep.num} {dep.title}
                    </span>
                    <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {dep.badge}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-start gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-200/80 bg-emerald-50 text-emerald-800 transition group-hover:bg-emerald-800 group-hover:text-white">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <strong className="block text-xs font-bold text-slate-900 group-hover:text-emerald-950">
                        {dep.title}
                      </strong>
                      <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                        {dep.desc}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100/80 text-[11px] font-bold text-emerald-800">
                  <span>Accéder à l’espace</span>
                  <ArrowUpRight className="h-3 w-3 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. Barre Inférieure Sobre — 3 Rôles Clés */}
      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 pt-2 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-4 text-[11px]">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
            <Mic className="h-3 w-3 text-emerald-700" />
            Capture vocale & WhatsApp
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 font-medium text-slate-700">
            <ShieldCheck className="h-3 w-3 text-emerald-700" />
            Visas Four-Eyes & Anti-fraude
          </span>
          <span className="hidden md:inline-flex items-center gap-1.5 font-medium text-slate-700">
            <MessageSquare className="h-3 w-3 text-emerald-700" />
            Conseiller Cora IA intégré
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span>© CAURI — Le siège de votre entreprise</span>
          <Link href="/espace" className="font-bold text-emerald-800 hover:underline">
            Ouvrir la session →
          </Link>
        </div>
      </footer>
    </div>
  );
}
