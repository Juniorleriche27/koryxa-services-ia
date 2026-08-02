"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Building2, FileCheck2, FileSpreadsheet, FolderSync, LayoutDashboard, Menu, Radar, ReceiptText, Settings, Tag, X, Zap } from "lucide-react";
import clsx from "clsx";

const navigation = [
  ["Vue d’ensemble", "/espace", LayoutDashboard],
  ["Offres & tarifs", "/espace/offres", Tag],
  ["Ventes", "/espace/ventes", ReceiptText],
  ["Procédures", "/espace/procedures", FileCheck2],
  ["Imports", "/espace/imports", FileSpreadsheet],
  ["Documents", "/espace/documents", FolderSync],
  ["Radar", "/espace/radar", Radar],
  ["Validations", "/espace/validations", Activity],
  ["Actions", "/espace/actions", Zap],
  ["Organisation", "/espace/organisation", Building2],
  ["Paramètres", "/espace/parametres", Settings],
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return <div className="app-shell">
    <aside className={clsx("app-sidebar", open && "is-open")}>
      <div className="app-brand"><span className="app-brand-mark">K</span><div><strong>KORYXA</strong><small>Service IA</small></div><button className="app-icon-button mobile-only" onClick={() => setOpen(false)} aria-label="Fermer le menu"><X size={20}/></button></div>
      <div className="app-company"><span>Entreprise</span><strong>Kalo Distribution</strong><small>Espace opérationnel</small></div>
      <nav aria-label="Navigation principale">
        {navigation.map(([label, href, Icon]) => <Link key={href} href={href} onClick={() => setOpen(false)} className={clsx("app-nav-link", pathname === href && "is-active")}><Icon size={18}/><span>{label}</span></Link>)}
      </nav>
      <div className="app-sidebar-foot"><div className="app-user-avatar">JD</div><div><strong>Junior</strong><small>Propriétaire</small></div></div>
    </aside>
    {open && <button className="app-overlay" aria-label="Fermer le menu" onClick={() => setOpen(false)}/>} 
    <main className="app-main">
      <header className="app-topbar"><button className="app-icon-button mobile-only" onClick={() => setOpen(true)} aria-label="Ouvrir le menu"><Menu size={21}/></button><div><span className="app-eyebrow">Mémoire opérationnelle</span><strong>Registre + Radar</strong></div><div className="app-topbar-actions"><span className="app-live"><i/>Synchronisé</span><button className="app-avatar-button">JD</button></div></header>
      <div className="app-content">{children}</div>
    </main>
  </div>
}
