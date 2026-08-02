"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Building2, FileCheck2, FileSpreadsheet, FolderSync, LayoutDashboard, Menu, Radar, ReceiptText, Settings, Tag, X, Zap } from "lucide-react";
import clsx from "clsx";
import { UserButton, useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { serviceIaFetch } from "@/lib/service-ia/api";

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
  const [organization, setOrganization] = useState("Organisation KORYXA");
  const { user } = useUser();
  const userName = user?.fullName || user?.primaryEmailAddress?.emailAddress || "Compte KORYXA";
  const initials = userName.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();
  useEffect(() => {
    serviceIaFetch<{ name: string }>("/organizations/current")
      .then(data => setOrganization(data.name))
      .catch(() => setOrganization("Organisation à configurer"));
  }, []);
  return <div className="app-shell">
    <aside className={clsx("app-sidebar", open && "is-open")}>
      <div className="app-brand"><span className="app-brand-mark">K</span><div><strong>KORYXA</strong><small>Service IA</small></div><button className="app-icon-button mobile-only" onClick={() => setOpen(false)} aria-label="Fermer le menu"><X size={20}/></button></div>
      <div className="app-company"><span>Entreprise</span><strong>{organization}</strong><small>Espace opérationnel</small></div>
      <nav aria-label="Navigation principale">
        {navigation.map(([label, href, Icon]) => <Link key={href} href={href} onClick={() => setOpen(false)} className={clsx("app-nav-link", pathname === href && "is-active")}><Icon size={18}/><span>{label}</span></Link>)}
      </nav>
      <div className="app-sidebar-foot"><div className="app-user-avatar">{user?.imageUrl ? <img src={user.imageUrl} alt="" className="h-full w-full rounded-full object-cover" /> : initials}</div><div><strong>{userName}</strong><small>Compte KORYXA</small></div></div>
    </aside>
    {open && <button className="app-overlay" aria-label="Fermer le menu" onClick={() => setOpen(false)}/>} 
    <main className="app-main">
      <header className="app-topbar"><button className="app-icon-button mobile-only" onClick={() => setOpen(true)} aria-label="Ouvrir le menu"><Menu size={21}/></button><div><span className="app-eyebrow">Mémoire opérationnelle</span><strong>Registre + Radar</strong></div><div className="app-topbar-actions"><span className="app-live"><i/>API connectée</span><UserButton appearance={{elements:{avatarBox:"h-11 w-11"}}}/></div></header>
      <div className="app-content">{children}</div>
    </main>
  </div>
}
