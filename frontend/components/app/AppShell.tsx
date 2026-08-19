"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Building2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileCheck2,
  FileSpreadsheet,
  FolderSync,
  LayoutDashboard,
  Menu,
  Mic,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Radar,
  ReceiptText,
  Search,
  Settings,
  Tag,
  Wallet,
  Building,
  UserCheck,
  X,
  Zap,
  Bot,
} from "lucide-react";

import clsx from "clsx";
import { UserButton, useUser } from "@clerk/nextjs";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { getBusinessCategoryConfig } from "@/lib/service-ia/business-categories";
import BrandLogo from "@/components/layout/BrandLogo";
import { OrganizationOnboarding } from "./OrganizationOnboarding";
import { CommandPalette } from "./CommandPalette";
import { VoiceCaptureModal } from "./VoiceCaptureModal";
import { OfflineSyncBanner } from "./OfflineSyncBanner";
import { AICopilotDrawer } from "./AICopilotDrawer";


export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [organization, setOrganization] = useState<{
    name: string;
    business_category?: string;
    latitude?: number | null;
    longitude?: number | null;
    logo_updated_at?: string | null;
    onboarding_completed_at?: string | null;
    created_by_user_id?: string;
  }>({ name: "Organisation KORYXA", business_category: "retail" });
  const [organizationLoaded, setOrganizationLoaded] = useState(false);
  const { user } = useUser();
  const userName = user?.fullName || user?.primaryEmailAddress?.emailAddress || "Compte KORYXA";
  const initials = userName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  const proConfig = getBusinessCategoryConfig(organization.business_category);

  const navGroups = useMemo(() => [
    {
      id: "pilotage",
      title: "Pilotage & Ventes",
      items: [
        { label: "Cockpit Décisionnel", href: "/espace", icon: LayoutDashboard },
        { label: proConfig.registers.sales.title, href: "/espace/ventes", icon: ReceiptText },
        { label: proConfig.registers.offers.title, href: "/espace/offres", icon: Tag },
        { label: proConfig.registers.expenses.title, href: "/espace/depenses", icon: Wallet },
        { label: proConfig.registers.suppliers.title, href: "/espace/fournisseurs", icon: Building },
      ],
    },
    {
      id: "operations",
      title: "Équipe & Opérations",
      items: [
        { label: proConfig.registers.attendance.title, href: "/espace/presence", icon: UserCheck },
        { label: proConfig.registers.procedures.title, href: "/espace/procedures", icon: FileCheck2 },
        { label: "Documents & Preuves", href: "/espace/documents", icon: FolderSync },
      ],
    },
    {
      id: "radar",
      title: "Radar & Qualité",
      items: [
        { label: "Radar Sentinelle", href: "/espace/radar", icon: Radar },
        { label: "Validations IA", href: "/espace/validations", icon: Activity },
        { label: "Plan d'Actions", href: "/espace/actions", icon: Zap },
      ],
    },
    {
      id: "system",
      title: "Canaux & Système",
      items: [
        { label: "WhatsApp Gateway", href: "/espace/whatsapp", icon: MessageSquare },
        { label: "Reprise & Imports", href: "/espace/imports", icon: FileSpreadsheet },
        { label: "Organisation & Membres", href: "/espace/organisation", icon: Building2 },
        { label: "Paramètres", href: "/espace/parametres", icon: Settings },
      ],
    },
  ], [proConfig]);

  // Open / closed accordion groups state
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    pilotage: true,
    operations: false,
    radar: false,
    system: false,
  });

  // Automatically expand the group containing the active page
  useEffect(() => {
    navGroups.forEach((group) => {
      const hasActive = group.items.some((item) => item.href === pathname);
      if (hasActive) {
        setOpenGroups((prev) => ({ ...prev, [group.id]: true }));
      }
    });
  }, [pathname, navGroups]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const pageContext: Record<string, { eyebrow: string; description: string }> = {
    "/espace": { eyebrow: "Mémoire opérationnelle", description: `Pilotez votre activité (${proConfig.name})` },
    "/espace/offres": { eyebrow: proConfig.registers.offers.title, description: proConfig.registers.offers.subtitle },
    "/espace/ventes": { eyebrow: proConfig.registers.sales.title, description: proConfig.registers.sales.subtitle },
    "/espace/depenses": { eyebrow: proConfig.registers.expenses.title, description: proConfig.registers.expenses.subtitle },
    "/espace/fournisseurs": { eyebrow: proConfig.registers.suppliers.title, description: proConfig.registers.suppliers.subtitle },
    "/espace/procedures": { eyebrow: proConfig.registers.procedures.title, description: proConfig.registers.procedures.subtitle },
    "/espace/presence": { eyebrow: proConfig.registers.attendance.title, description: proConfig.registers.attendance.subtitle },
    "/espace/imports": { eyebrow: "Reprise de données", description: "Importez vos informations existantes en toute simplicité" },
    "/espace/documents": { eyebrow: "Documents utiles", description: "Rassemblez les preuves et fichiers de votre activité" },
    "/espace/radar": { eyebrow: "Qualité des informations", description: "Repérez ce qui manque, vieillit ou doit être vérifié" },
    "/espace/validations": { eyebrow: "Contrôle humain", description: "Confirmez les corrections avant leur application" },
    "/espace/actions": { eyebrow: "Amélioration continue", description: "Transformez les constats en actions concrètes" },
    "/espace/whatsapp": { eyebrow: "Intégrations & Mobilité", description: "Enregistrez vos ventes directement depuis WhatsApp" },
    "/espace/organisation": { eyebrow: "Équipe", description: "Gérez les membres et leurs responsabilités" },
    "/espace/parametres": { eyebrow: "Configuration", description: "Adaptez les contrôles et votre catégorie professionnelle" },
  };

  const context = pageContext[pathname] ?? pageContext["/espace"];

  useEffect(() => {
    const load = () =>
      serviceIaFetch<{
        name: string;
        business_category?: string;
        latitude?: number | null;
        longitude?: number | null;
        logo_updated_at?: string | null;
        onboarding_completed_at?: string | null;
        created_by_user_id?: string;
      }>("/organizations/current")
        .then(setOrganization)
        .catch(() => setOrganization({ name: "Organisation à configurer", business_category: "retail" }))
        .finally(() => setOrganizationLoaded(true));
    void load();
    const updated = (event: Event) =>
      setOrganization((event as CustomEvent<any>).detail);
    window.addEventListener("koryxa:organization-updated", updated);
    return () => window.removeEventListener("koryxa:organization-updated", updated);
  }, []);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem("koryxa:sidebar-collapsed") === "true");
  }, []);


  const [voiceOpen, setVoiceOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);

  // Global Cmd+K / Ctrl+K and Cmd+J / Ctrl+J keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setCopilotOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);


  const toggleCollapsed = () =>
    setCollapsed((value) => {
      const next = !value;
      window.localStorage.setItem("koryxa:sidebar-collapsed", String(next));
      return next;
    });

  const onboardingRequired =
    organizationLoaded &&
    Boolean(user?.id) &&
    organization.created_by_user_id === user?.id &&
    !organization.onboarding_completed_at;

  if (pathname === "/espace/presence/borne") {
    return <main className="min-h-screen w-full bg-slate-950">{children}</main>;
  }

  return (
    <div className={clsx("app-shell", collapsed && "is-sidebar-collapsed")}>
      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onOpenVoice={() => setVoiceOpen(true)}
      />

      <VoiceCaptureModal
        open={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        onSuccess={() => {
          // Trigger custom event so tables reload
          window.dispatchEvent(new CustomEvent("koryxa:record-created"));
        }}
      />

      <AICopilotDrawer
        open={copilotOpen}
        onClose={() => setCopilotOpen(false)}
      />

      {onboardingRequired && (
        <OrganizationOnboarding
          organization={organization}
          onComplete={(updated) => setOrganization((current) => ({ ...current, ...updated }))}
        />
      )}


      <aside className={clsx("app-sidebar", open && "is-open")}>
        <div className="app-brand">
          <BrandLogo className="app-brand-logo" />
          <div>
            <strong>KORYXA</strong>
            <small>Service IA & Web</small>
          </div>
          <button className="app-icon-button mobile-only" onClick={() => setOpen(false)} aria-label="Fermer le menu">
            <X size={20} />
          </button>
        </div>

        <button
          className="app-sidebar-toggle desktop-only"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Déployer la barre latérale" : "Réduire la barre latérale"}
          title={collapsed ? "Déployer" : "Réduire"}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>

        <div className="app-company">
          {organization.logo_updated_at ? (
            <img
              className="app-company-logo"
              src={`/api/service-ia/organizations/current/logo?v=${encodeURIComponent(organization.logo_updated_at)}`}
              alt=""
            />
          ) : null}
          <div>
            <span>{proConfig.emoji} {proConfig.shortName}</span>
            <strong>{organization.name}</strong>
            <small>{proConfig.badge}</small>
          </div>
        </div>

        <nav aria-label="Navigation principale" className="app-nav-accordion-container space-y-1.5 py-1">
          {navGroups.map((group) => {
            const isOpen = openGroups[group.id];
            const hasActiveChild = group.items.some((item) => item.href === pathname);

            return (
              <div key={group.id} className="app-nav-group">
                {/* Accordion Group Header (Hidden in collapsed mode) */}
                {!collapsed && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className={clsx(
                      "w-full flex items-center justify-between px-3 py-1.5 text-[10px] uppercase font-black tracking-wider transition rounded-lg cursor-pointer",
                      hasActiveChild
                        ? "text-primary hover:text-primary/90"
                        : "text-muted-foreground/80 hover:text-foreground hover:bg-muted/40"
                    )}
                  >
                    <span className="truncate">{group.title}</span>
                    {isOpen ? (
                      <ChevronDown size={13} className="opacity-70 shrink-0" />
                    ) : (
                      <ChevronRight size={13} className="opacity-70 shrink-0" />
                    )}
                  </button>
                )}

                {/* Sub-items (Always shown if open, or in collapsed mode) */}
                {(isOpen || collapsed) && (
                  <div className={clsx("app-nav-group-items space-y-0.5", !collapsed && "mt-0.5")}>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          title={collapsed ? item.label : undefined}
                          className={clsx("app-nav-link", isActive && "is-active")}
                        >
                          <Icon size={18} />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Subtle divider in collapsed mode */}
                {collapsed && <hr className="my-1.5 border-border/40" />}
              </div>
            );
          })}
        </nav>

        <div className="app-sidebar-foot">
          <div className="app-user-avatar">
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div>
            <strong>{userName}</strong>
            <small>Compte KORYXA</small>
          </div>
        </div>
      </aside>

      {open && <button className="app-overlay" aria-label="Fermer le menu" onClick={() => setOpen(false)} />}

      <main className="app-main">
        <OfflineSyncBanner />

        <header className="app-topbar">
          <button className="app-icon-button mobile-only" onClick={() => setOpen(true)} aria-label="Ouvrir le menu">
            <Menu size={21} />
          </button>

          <div className="app-topbar-context">
            <h1 className="text-sm sm:text-base font-bold text-foreground tracking-tight m-0 p-0">{context.eyebrow}</h1>
          </div>

          <div className="app-topbar-actions">
            {/* Direct AI Copilot Trigger Button */}
            <button
              type="button"
              className="kx-topbar-copilot-btn"
              onClick={() => setCopilotOpen(true)}
              title="Ouvrir Cora, votre assistante IA (Cmd + J / Ctrl + J)"
              aria-label="Ouvrir Cora, votre assistante IA"
            >
              <span className="kx-cora-robot" aria-hidden="true">
                <Bot size={17} strokeWidth={2.4} />
              </span>
              <span className="kx-cora-label">Cora <small>IA</small></span>
              <kbd className="kx-cmd-kbd">⌘J</kbd>
            </button>

            {/* Direct Voice Capture Trigger Button (Desktop topbar) */}
            <button
              type="button"
              className="kx-topbar-voice-btn hidden sm:inline-flex"
              onClick={() => setVoiceOpen(true)}
              title="Dictée vocale intelligente (Micro)"
            >
              <Mic size={15} />
              <span className="kx-topbar-search-text">Dicter</span>
            </button>

            {/* Quick Cmd+K search button */}
            <button
              className="kx-topbar-search-trigger"
              onClick={() => setCommandOpen(true)}
              title="Ouvrir la palette de commande (Cmd + K / Ctrl + K)"
            >
              <Search size={14} />
              <span className="kx-topbar-search-text">Recherche & actions…</span>
              <kbd className="kx-cmd-kbd">⌘K</kbd>
            </button>

            <Link href="/" className="app-public-link hidden lg:inline-flex" title="Retourner sur le site public">
              <ExternalLink size={15} />
              <span>Site public</span>
            </Link>

            <span className="app-live hidden xl:inline-flex">
              <i />
              API connectée
            </span>

            <UserButton appearance={{ elements: { avatarBox: "h-9 w-9 sm:h-11 sm:w-11" } }} />
          </div>
        </header>

        <div className="app-content pb-24 lg:pb-8">{children}</div>

        {/* Mobile Bottom Navigation Bar (Glassmorphism Dock) */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border/80 px-2 py-1.5 flex items-center justify-around lg:hidden shadow-[0_-10px_25px_rgba(0,0,0,0.06)]">
          <Link
            href="/espace"
            className={clsx(
              "flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition text-[10px] font-bold",
              pathname === "/espace"
                ? "text-primary font-black"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutDashboard size={20} />
            <span>Cockpit</span>
          </Link>

          <Link
            href="/espace/ventes"
            className={clsx(
              "flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition text-[10px] font-bold",
              pathname === "/espace/ventes"
                ? "text-primary font-black"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ReceiptText size={20} />
            <span>Ventes</span>
          </Link>

          {/* Raised Pulsing Center Mic Button for Instant Voice Capture */}
          <button
            type="button"
            onClick={() => setVoiceOpen(true)}
            className="relative -top-3 w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white shadow-[0_6px_20px_rgba(16,185,129,0.45)] active:scale-95 transition-all flex items-center justify-center ring-4 ring-background cursor-pointer"
            title="Dictée vocale directe"
            aria-label="Dictée vocale"
          >
            <Mic size={22} />
          </button>

          <Link
            href="/espace/radar"
            className={clsx(
              "flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition text-[10px] font-bold",
              pathname === "/espace/radar"
                ? "text-primary font-black"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Radar size={20} />
            <span>Radar</span>
          </Link>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-muted-foreground hover:text-foreground transition text-[10px] font-bold cursor-pointer"
            aria-label="Ouvrir le menu complet"
          >
            <Menu size={20} />
            <span>Menu</span>
          </button>
        </nav>
      </main>
    </div>
  );
}
