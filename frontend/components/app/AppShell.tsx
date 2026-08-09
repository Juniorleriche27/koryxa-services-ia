import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Building2,
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
  X,
  Zap,
  Sparkles,
} from "lucide-react";

import clsx from "clsx";
import { UserButton, useUser } from "@clerk/nextjs";
import { serviceIaFetch } from "@/lib/service-ia/api";
import BrandLogo from "@/components/layout/BrandLogo";
import { OrganizationOnboarding } from "./OrganizationOnboarding";
import { CommandPalette } from "./CommandPalette";
import { VoiceCaptureModal } from "./VoiceCaptureModal";
import { OfflineSyncBanner } from "./OfflineSyncBanner";
import { AICopilotDrawer } from "./AICopilotDrawer";


const navigation = [
  ["Vue d’ensemble", "/espace", LayoutDashboard],
  ["Offres & tarifs", "/espace/offres", Tag],
  ["Ventes", "/espace/ventes", ReceiptText],
  ["Dépenses & Achats", "/espace/depenses", Wallet],
  ["Fournisseurs", "/espace/fournisseurs", Building],
  ["Procédures", "/espace/procedures", FileCheck2],
  ["Imports", "/espace/imports", FileSpreadsheet],
  ["Documents", "/espace/documents", FolderSync],
  ["Radar", "/espace/radar", Radar],
  ["Validations", "/espace/validations", Activity],
  ["Actions", "/espace/actions", Zap],
  ["WhatsApp Gateway", "/espace/whatsapp", MessageSquare],
  ["Organisation", "/espace/organisation", Building2],
  ["Paramètres", "/espace/parametres", Settings],
] as const;

const pageContext: Record<string, { eyebrow: string; description: string }> = {
  "/espace": { eyebrow: "Mémoire opérationnelle", description: "Pilotez l’essentiel de votre entreprise" },
  "/espace/offres": { eyebrow: "Offres & tarifs", description: "Centralisez ce que vous vendez et à quel prix" },
  "/espace/ventes": { eyebrow: "Suivi commercial", description: "Suivez vos ventes et vos encaissements" },
  "/espace/depenses": { eyebrow: "Trésorerie & Achats", description: "Suivez vos dépenses et règlements fournisseurs" },
  "/espace/fournisseurs": { eyebrow: "Partenaires & Achats", description: "Gérez vos fournisseurs et prestataires réguliers" },
  "/espace/procedures": { eyebrow: "Méthodes de travail", description: "Formalisez la façon dont votre entreprise fonctionne" },
  "/espace/imports": { eyebrow: "Reprise de données", description: "Importez vos informations existantes en toute simplicité" },
  "/espace/documents": { eyebrow: "Documents utiles", description: "Rassemblez les preuves et fichiers de votre activité" },
  "/espace/radar": { eyebrow: "Qualité des informations", description: "Repérez ce qui manque, vieillit ou doit être vérifié" },
  "/espace/validations": { eyebrow: "Contrôle humain", description: "Confirmez les corrections avant leur application" },
  "/espace/actions": { eyebrow: "Amélioration continue", description: "Transformez les constats en actions concrètes" },
  "/espace/whatsapp": { eyebrow: "Intégrations & Mobilité", description: "Enregistrez vos ventes directement depuis WhatsApp" },
  "/espace/organisation": { eyebrow: "Équipe", description: "Gérez les membres et leurs responsabilités" },
  "/espace/parametres": { eyebrow: "Configuration", description: "Adaptez les contrôles aux besoins de votre entreprise" },
};


export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [organization, setOrganization] = useState<{
    name: string;
    logo_updated_at?: string | null;
    onboarding_completed_at?: string | null;
    created_by_user_id?: string;
  }>({ name: "Organisation KORYXA" });
  const [organizationLoaded, setOrganizationLoaded] = useState(false);
  const { user } = useUser();
  const userName = user?.fullName || user?.primaryEmailAddress?.emailAddress || "Compte KORYXA";
  const initials = userName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const context = pageContext[pathname] ?? pageContext["/espace"];

  useEffect(() => {
    const load = () =>
      serviceIaFetch<{
        name: string;
        logo_updated_at?: string | null;
        onboarding_completed_at?: string | null;
        created_by_user_id?: string;
      }>("/organizations/current")
        .then(setOrganization)
        .catch(() => setOrganization({ name: "Organisation à configurer" }))
        .finally(() => setOrganizationLoaded(true));
    void load();
    const updated = (event: Event) =>
      setOrganization((event as CustomEvent<{ name: string; logo_updated_at?: string | null }>).detail);
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
            <span>Entreprise</span>
            <strong>{organization.name}</strong>
            <small>Espace opérationnel</small>
          </div>
        </div>

        <nav aria-label="Navigation principale">
          {navigation.map(([label, href, Icon]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              title={collapsed ? label : undefined}
              className={clsx("app-nav-link", pathname === href && "is-active")}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
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
            <span className="app-eyebrow">{context.eyebrow}</span>
            <strong>{context.description}</strong>
          </div>

          <div className="app-topbar-actions">
            {/* Direct AI Copilot Trigger Button */}
            <button
              type="button"
              className="kx-topbar-copilot-btn"
              onClick={() => setCopilotOpen(true)}
              title="Ouvrir le Copilote IA KORYXA (Cmd + J / Ctrl + J)"
            >
              <Sparkles size={15} />
              <span className="kx-topbar-search-text">Koryxa IA</span>
              <kbd className="kx-cmd-kbd">⌘J</kbd>
            </button>

            {/* Direct Voice Capture Trigger Button */}
            <button
              type="button"
              className="kx-topbar-voice-btn"
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


            <Link href="/" className="app-public-link" title="Retourner sur le site public">
              <ExternalLink size={15} />
              <span>Site public</span>
            </Link>

            <span className="app-live">
              <i />
              API connectée
            </span>

            <UserButton appearance={{ elements: { avatarBox: "h-11 w-11" } }} />
          </div>
        </header>

        <div className="app-content">{children}</div>
      </main>
    </div>
  );
}


