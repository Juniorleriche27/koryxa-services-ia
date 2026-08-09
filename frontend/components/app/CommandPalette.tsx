"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Tag,
  ReceiptText,
  FileCheck2,
  Radar,
  Settings,
  Activity,
  Zap,
  Building2,
  Plus,
  Printer,
  Sparkles,
  FileSpreadsheet,
  FolderSync,
  X,
  Mic,
  MessageSquare,
  Wallet,
  Building,
} from "lucide-react";

interface CommandItem {
  id: string;
  title: string;
  category: "Navigation" | "Actions Rapides" | "Registres" | "Rapports";
  icon: React.ElementType;
  shortcut?: string;
  perform: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onOpenCreate?: (kind: "offers" | "sales" | "procedures") => void;
  onOpenVoice?: () => void;
  onOpenReport?: () => void;
  onTriggerRadar?: () => void;
}

export function CommandPalette({
  open,
  onClose,
  onOpenCreate,
  onOpenVoice,
  onOpenReport,
  onTriggerRadar,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands = useMemo<CommandItem[]>(() => {
    return [
      // Actions Rapides
      {
        id: "open-copilot",
        title: "Ouvrir le Copilote IA KORYXA (Demandez à l'IA)",
        category: "Actions Rapides",
        icon: Sparkles,
        shortcut: "⌘J",
        perform: () => {
          onClose();
          // Dispatch shortcut event for AppShell
          window.dispatchEvent(
            new KeyboardEvent("keydown", { key: "j", metaKey: true, bubbles: true })
          );
        },
      },
      {
        id: "voice-capture",
        title: "Dictée Vocale Intelligente (Audio-to-Register)",
        category: "Actions Rapides",
        icon: Mic,
        shortcut: "V",
        perform: () => {
          onClose();
          onOpenVoice?.();
        },
      },

      {
        id: "create-sale",
        title: "Enregistrer une nouvelle vente",
        category: "Actions Rapides",
        icon: Plus,
        shortcut: "N V",
        perform: () => {
          onClose();
          onOpenCreate?.("sales");
        },
      },
      {
        id: "create-expense",
        title: "Enregistrer une nouvelle dépense / facture",
        category: "Actions Rapides",
        icon: Wallet,
        shortcut: "N D",
        perform: () => {
          onClose();
          router.push("/espace/depenses");
        },
      },
      {
        id: "create-offer",
        title: "Ajouter une offre ou un tarif officiel",
        category: "Actions Rapides",
        icon: Plus,
        shortcut: "N O",
        perform: () => {
          onClose();
          onOpenCreate?.("offers");
        },
      },

      {
        id: "create-procedure",
        title: "Formaliser une nouvelle procédure métier",
        category: "Actions Rapides",
        icon: Plus,
        shortcut: "N P",
        perform: () => {
          onClose();
          onOpenCreate?.("procedures");
        },
      },
      {
        id: "trigger-radar",
        title: "Lancer l'analyse de qualité Radar",
        category: "Actions Rapides",
        icon: Sparkles,
        shortcut: "R",
        perform: () => {
          onClose();
          if (onTriggerRadar) {
            onTriggerRadar();
          } else {
            router.push("/espace/radar");
          }
        },
      },
      {
        id: "print-report",
        title: "Générer & Imprimer le Bilan Opérationnel",
        category: "Rapports",
        icon: Printer,
        shortcut: "P",
        perform: () => {
          onClose();
          if (onOpenReport) {
            onOpenReport();
          } else {
            router.push("/espace");
          }
        },
      },

      // Navigation
      {
        id: "nav-dashboard",
        title: "Cockpit & Vue d'ensemble du Dirigeant",
        category: "Navigation",
        icon: LayoutDashboard,
        perform: () => {
          onClose();
          router.push("/espace");
        },
      },
      {
        id: "nav-sales",
        title: "Ventes, encaissements et suivi commercial",
        category: "Registres",
        icon: ReceiptText,
        perform: () => {
          onClose();
          router.push("/espace/ventes");
        },
      },
      {
        id: "nav-offers",
        title: "Offres, tarifs et conditions de vente",
        category: "Registres",
        icon: Tag,
        perform: () => {
          onClose();
          router.push("/espace/offres");
        },
      },
      {
        id: "nav-procedures",
        title: "Procédures, méthodes et gouvernance",
        category: "Registres",
        icon: FileCheck2,
        perform: () => {
          onClose();
          router.push("/espace/procedures");
        },
      },
      {
        id: "nav-radar",
        title: "Knowlia Radar (Score de santé & Détection d'anomalies)",
        category: "Navigation",
        icon: Radar,
        perform: () => {
          onClose();
          router.push("/espace/radar");
        },
      },
      {
        id: "nav-validations",
        title: "Validations & Contrôle humain des données",
        category: "Navigation",
        icon: Activity,
        perform: () => {
          onClose();
          router.push("/espace/validations");
        },
      },
      {
        id: "nav-actions",
        title: "Actions correctives & Plan de progrès (Kanban)",
        category: "Navigation",
        icon: Zap,
        perform: () => {
          onClose();
          router.push("/espace/actions");
        },
      },
      {
        id: "nav-imports",
        title: "Imports Excel, CSV et reprise de données",
        category: "Navigation",
        icon: FileSpreadsheet,
        perform: () => {
          onClose();
          router.push("/espace/imports");
        },
      },
      {
        id: "nav-documents",
        title: "Mémoire documentaire & Pièces jointes Knowlia",
        category: "Navigation",
        icon: FolderSync,
        perform: () => {
          onClose();
          router.push("/espace/documents");
        },
      },
      {
        id: "nav-organization",
        title: "Organisation, équipe et membres",
        category: "Navigation",
        icon: Building2,
        perform: () => {
          onClose();
          router.push("/espace/organisation");
        },
      },
      {
        id: "nav-settings",
        title: "Paramètres Radar & Règles de conformité",
        category: "Navigation",
        icon: Settings,
        perform: () => {
          onClose();
          router.push("/espace/parametres");
        },
      },
    ];
  }, [router, onClose, onOpenCreate, onOpenVoice, onOpenReport, onTriggerRadar]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const lower = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(lower) ||
        c.category.toLowerCase().includes(lower)
    );
  }, [commands, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filtered.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filtered.length - 1
        );
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        filtered[selectedIndex].perform();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, filtered, selectedIndex]);

  if (!open) return null;

  return (
    <div
      className="kx-command-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="kx-command-box"
        role="dialog"
        aria-modal="true"
        aria-label="Palette de commande"
      >
        <div className="kx-command-header">
          <Search size={18} className="kx-command-search-icon" />
          <input
            autoFocus
            type="text"
            className="kx-command-input"
            placeholder="Tapez une action, un registre ou une page… (ex: Vente, Radar, Bilan)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            className="kx-command-close-btn"
            onClick={onClose}
            aria-label="Fermer la palette"
          >
            <X size={16} />
          </button>
        </div>

        <div className="kx-command-list">
          {filtered.length === 0 ? (
            <div className="kx-command-empty">
              <p>Aucun résultat pour « {query} »</p>
              <small>Essayez : Ventes, Offres, Procédures, Imprimer, Radar</small>
            </div>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  className={`kx-command-item ${isSelected ? "is-selected" : ""}`}
                  onClick={() => item.perform()}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="kx-command-item-icon">
                    <Icon size={16} />
                  </div>
                  <div className="kx-command-item-main">
                    <span className="kx-command-item-title">{item.title}</span>
                    <span className="kx-command-item-badge">{item.category}</span>
                  </div>
                  {item.shortcut && (
                    <span className="kx-command-item-shortcut">{item.shortcut}</span>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="kx-command-footer">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> Naviguer
          </span>
          <span>
            <kbd>↵</kbd> Sélectionner
          </span>
          <span>
            <kbd>Échap</kbd> Fermer
          </span>
        </div>
      </div>
    </div>
  );
}
