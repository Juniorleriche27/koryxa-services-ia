"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BookOpen,
  Building2,
  ChevronDown,
  ChevronRight,
  CreditCard,
  ExternalLink,
  FileCheck2,
  FileSpreadsheet,
  FolderSync,
  LayoutDashboard,
  Menu,
  Mic,
  MessageSquare,
  MessageSquarePlus,
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
  Sparkles,
  HelpCircle,
  Download,
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
import { InteractiveSpotlightTour } from "./InteractiveSpotlightTour";
import { QuickHelpModal } from "./QuickHelpModal";
import { PwaInstaller } from "./PwaInstaller";
import { LanguageSelector } from "./LanguageSelector";
import { useI18n } from "@/lib/i18n";


export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
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

  const proConfig = getBusinessCategoryConfig(organization.business_category, lang);

  const navGroups = useMemo(() => [
    {
      id: "pilotage",
      title: t("group_pilotage"),
      items: [
        { label: t("nav_cockpit"), href: "/espace", icon: LayoutDashboard },
        { label: proConfig.registers.sales.title, href: "/espace/ventes", icon: ReceiptText },
        { label: proConfig.registers.offers.title, href: "/espace/offres", icon: Tag },
        { label: proConfig.registers.expenses.title, href: "/espace/depenses", icon: Wallet },
        { label: proConfig.registers.suppliers.title, href: "/espace/fournisseurs", icon: Building },
      ],
    },
    {
      id: "operations",
      title: t("group_operations"),
      items: [
        { label: proConfig.registers.attendance.title, href: "/espace/presence", icon: UserCheck },
        { label: proConfig.registers.procedures.title, href: "/espace/procedures", icon: FileCheck2 },
        { label: t("nav_documents"), href: "/espace/documents", icon: FolderSync },
      ],
    },
    {
      id: "radar",
      title: t("group_radar"),
      items: [
        { label: t("nav_radar"), href: "/espace/radar", icon: Radar },
        { label: t("nav_validations"), href: "/espace/validations", icon: Activity },
        { label: t("nav_actions"), href: "/espace/actions", icon: Zap },
      ],
    },
    {
      id: "system",
      title: t("group_system"),
      items: [
        { label: t("nav_whatsapp"), href: "/espace/whatsapp", icon: MessageSquare },
        { label: "Formules & Facturation", href: "/espace/parametres/facturation", icon: CreditCard },
        { label: t("nav_imports"), href: "/espace/imports", icon: FileSpreadsheet },
        { label: t("nav_organization"), href: "/espace/organisation", icon: Building2 },
        { label: t("nav_settings"), href: "/espace/parametres", icon: Settings },
      ],
    },
    {
      id: "aide",
      title: t("group_help"),
      items: [
        { label: t("nav_manual"), href: "/espace/aide", icon: BookOpen },
        { label: t("nav_faq"), href: "/espace/aide?tab=faq", icon: HelpCircle },
        { label: t("nav_feedback"), href: "/espace/aide?tab=feedback", icon: MessageSquarePlus },
      ],
    },
  ], [proConfig, t]);

  // Open / closed accordion groups state - All closed by default
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    pilotage: false,
    operations: false,
    radar: false,
    system: false,
    aide: false,
  });

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

    const pageContext: Record<string, { eyebrow: string; description: string }> = {
    "/espace": { eyebrow: t("dash_eyebrow"), description: `${t("page_ctx_dashboard")} (${proConfig.name})` },
    "/espace/offres": { eyebrow: proConfig.registers.offers.title, description: proConfig.registers.offers.subtitle },
    "/espace/ventes": { eyebrow: proConfig.registers.sales.title, description: proConfig.registers.sales.subtitle },
    "/espace/depenses": { eyebrow: proConfig.registers.expenses.title, description: proConfig.registers.expenses.subtitle },
    "/espace/fournisseurs": { eyebrow: proConfig.registers.suppliers.title, description: proConfig.registers.suppliers.subtitle },
    "/espace/procedures": { eyebrow: proConfig.registers.procedures.title, description: proConfig.registers.procedures.subtitle },
    "/espace/presence": { eyebrow: proConfig.registers.attendance.title, description: proConfig.registers.attendance.subtitle },
    "/espace/imports": { eyebrow: t("page_ctx_imports"), description: t("page_ctx_imports_desc") },
    "/espace/documents": { eyebrow: t("page_ctx_documents"), description: t("page_ctx_documents_desc") },
    "/espace/radar": { eyebrow: t("page_ctx_radar"), description: t("page_ctx_radar_desc") },
    "/espace/validations": { eyebrow: t("page_ctx_validations"), description: t("page_ctx_validations_desc") },
    "/espace/actions": { eyebrow: t("page_ctx_actions"), description: t("page_ctx_actions_desc") },
    "/espace/whatsapp": { eyebrow: t("page_ctx_whatsapp"), description: t("page_ctx_whatsapp_desc") },
    "/espace/organisation": { eyebrow: t("page_ctx_org"), description: t("page_ctx_org_desc") },
    "/espace/parametres": { eyebrow: t("page_ctx_settings"), description: t("page_ctx_settings_desc") },
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
        // A transport/authentication failure must never be interpreted as a
        // missing organization, otherwise the UI displays a false onboarding.
        .catch(() => undefined)
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


  const [isStandalone, setIsStandalone] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(false);

  useEffect(() => {
    setInstallDismissed(window.localStorage.getItem("koryxa:install-sidebar-dismissed") === "true");
  }, []);

  useEffect(() => {
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes("android-app://");
      setIsStandalone(isStandaloneMode);
    };
    checkStandalone();
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    mediaQuery.addEventListener?.("change", checkStandalone);
    return () => mediaQuery.removeEventListener?.("change", checkStandalone);
  }, []);

  const toggleCollapsed = () =>
    setCollapsed((value) => {
      const next = !value;
      window.localStorage.setItem("koryxa:sidebar-collapsed", String(next));
      return next;
    });

  const onboardingRequired =
    organizationLoaded &&
    !organization.onboarding_completed_at &&
    (organization.name === "Organisation à configurer" || organization.name === "Nouvelle Organisation");

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

      <InteractiveSpotlightTour proConfig={proConfig} />

      <QuickHelpModal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        proConfig={proConfig}
        onStartTour={() => {
          window.dispatchEvent(new CustomEvent("koryxa:start-tour"));
        }}
        onOpenVoice={() => setVoiceOpen(true)}
        onOpenCopilot={() => setCopilotOpen(true)}
      />

      <PwaInstaller />

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

        <div className="app-company-card">
          <div className="app-company-avatar">
            {organization.logo_updated_at ? (
              <img
                className="h-full w-full rounded-xl object-contain bg-white p-0.5"
                src={`/api/service-ia/organizations/current/logo?v=${encodeURIComponent(organization.logo_updated_at)}`}
                alt={organization.name}
              />
            ) : (
              <span className="app-company-initials">
                {organization.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="app-company-info min-w-0 flex-1">
            <strong className="app-company-name truncate block text-sm font-extrabold text-foreground tracking-tight">
              {organization.name}
            </strong>
            <span className="app-company-category truncate block text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
              {proConfig.emoji} {proConfig.badge}
            </span>
          </div>
        </div>

        <nav data-tour="nav-blocks" aria-label="Navigation principale" className="app-nav-accordion-container space-y-1.5 py-1 flex-1 overflow-y-auto">
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
                      "w-full flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer text-left",
                      isOpen
                        ? "bg-muted/60 text-slate-950 font-bold shadow-xs"
                        : "hover:bg-muted/30 text-slate-950 font-bold"
                    )}
                  >
                    <span className="truncate text-[13.5px] font-bold text-slate-950 tracking-tight">
                      {group.title}
                    </span>
                    {isOpen ? (
                      <ChevronDown size={15} className="text-slate-900 shrink-0" />
                    ) : (
                      <ChevronRight size={15} className="text-slate-700 shrink-0" />
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

        {/* PWA Install Trigger in Sidebar (Hidden if already installed/standalone or dismissed) */}
        {!isStandalone && !installDismissed && (
          <div className="p-2.5 border-t border-border/60 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("koryxa:open-install-pwa"));
                setOpen(false);
              }}
              title={collapsed ? "Installer l'application sur cet appareil" : undefined}
              className={clsx(
                "flex-1 flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 shadow-2xs",
                collapsed && "justify-center px-1.5"
              )}
            >
              <Download size={15} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
              {!collapsed && <span>{t("install_app")}</span>}
            </button>
            {!collapsed && (
              <button
                type="button"
                onClick={() => {
                  setInstallDismissed(true);
                  window.localStorage.setItem("koryxa:install-sidebar-dismissed", "true");
                }}
                title="Masquer ce raccourci"
                aria-label="Masquer ce raccourci"
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </aside>

      {open && <button className="app-overlay" aria-label="Fermer le menu" onClick={() => setOpen(false)} />}

      <main className="app-main">
        <OfflineSyncBanner />

        <header className="app-topbar">
          <button className="app-icon-button mobile-only" onClick={() => setOpen(true)} aria-label="Ouvrir le menu">
            <Menu size={21} />
          </button>

          <div className="app-topbar-context">
            <h1 className="text-sm sm:text-base font-bold text-foreground tracking-tight m-0 p-0">
              {pathname === "/espace" ? t("topbar_eyebrow") : context.eyebrow}
            </h1>
          </div>

          <div className="app-topbar-actions">
            {/* Quick Cmd+K search button */}
            <button
              className="kx-topbar-search-trigger"
              onClick={() => setCommandOpen(true)}
              title="Ouvrir la palette de commande (Cmd + K / Ctrl + K)"
            >
              <Search size={14} />
              <span className="kx-topbar-search-text">{t("search_prompt")}</span>
              <kbd className="kx-cmd-kbd">⌘K</kbd>
            </button>

            {/* Quick Voice Trigger on PC (Hidden on Mobile) */}
            <button
              type="button"
              onClick={() => setVoiceOpen(true)}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition text-xs font-bold shadow-2xs cursor-pointer"
              title="Dictée Vocale IA (Enregistrer une vente, dépense ou opération)"
            >
              <Mic size={15} className="text-emerald-600 dark:text-emerald-400" />
              <span>{t("vocal_btn")}</span>
            </button>

            {/* Quick Help & Guidance trigger */}
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-emerald-700 hover:border-emerald-400 transition text-xs font-bold shadow-2xs cursor-pointer"
              title="Centre d'aide & visite guidée"
            >
              <HelpCircle size={15} className="text-emerald-600" />
              <span>{t("guide_btn")}</span>
            </button>

            {/* Language Switcher */}
            <LanguageSelector />

            <Link href="/" className="app-public-link hidden lg:inline-flex" title="Retourner sur le site public">
              <ExternalLink size={15} />
              <span>{t("public_site")}</span>
            </Link>

            <span className="app-live hidden xl:inline-flex">
              <i />
              {t("api_connected")}
            </span>

            <UserButton appearance={{ elements: { avatarBox: "h-9 w-9 sm:h-11 sm:w-11" } }} />
          </div>
        </header>

        <div className="app-content pb-24 lg:pb-8">{children}</div>

        {/* Floating Premium CORA AI Round Bubble Widget */}
        <div className="fixed bottom-20 right-4 lg:bottom-7 lg:right-7 z-40 group">
          <button
            type="button"
            data-tour="cora-ia"
            onClick={() => setCopilotOpen(true)}
            aria-label="Ouvrir Cora, votre assistante IA"
            title="Demandez à Cora IA (Cmd + J / Ctrl + J)"
            className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white shadow-[0_10px_25px_rgba(16,185,129,0.45)] hover:shadow-[0_15px_35px_rgba(16,185,129,0.6)] hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-white/30 dark:border-white/15 cursor-pointer"
          >
            {/* Ambient glowing pulse aura */}
            <span className="absolute -inset-1 rounded-full bg-emerald-500/25 animate-ping opacity-60 pointer-events-none" />

            {/* Robot AI Icon */}
            <Bot size={26} strokeWidth={2.3} className="relative z-10" />

            {/* Online Green Indicator Dot */}
            <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-300 border-2 border-emerald-800 shadow-xs z-20 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-950" />
            </span>
          </button>

          {/* Hover Tooltip / Floating Label */}
          <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 rounded-xl bg-slate-900/95 text-white text-xs font-bold whitespace-nowrap shadow-xl backdrop-blur-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:flex items-center gap-1.5 border border-white/10">
            <Sparkles size={13} className="text-emerald-400" />
            <span>Cora IA Métier</span>
            <kbd className="text-[10px] bg-slate-800 px-1 py-0.5 rounded text-slate-300">⌘J</kbd>
          </div>
        </div>

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

          {/* Center Orb Voice Dictation Action Button */}
          <button
            type="button"
            data-tour="voice-mic"
            onClick={() => setVoiceOpen(true)}
            className="flex flex-col items-center justify-center -mt-5"
            aria-label="Dicter une vente"
          >
            <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-[0_8px_20px_rgba(0,168,107,0.4)] flex items-center justify-center active:scale-95 transition-transform border-4 border-background">
              <Mic size={24} className="text-white animate-pulse" />
            </div>
            <span className="text-[9.5px] font-black text-primary mt-0.5 tracking-tight">
              Dicter
            </span>
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
            className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition text-[10px] font-bold text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <Menu size={20} />
            <span>Menu</span>
          </button>
        </nav>
      </main>
    </div>
  );
}
