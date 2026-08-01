"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import BrandLogo from "@/components/layout/BrandLogo";
import { navItems, pillars } from "@/components/marketing/ServiceMarketing";

export default function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [desktopServicesOpen, setDesktopServicesOpen] = useState(false);
  const desktopMenuRef = useRef<HTMLDivElement>(null);
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    setOpen(false);
    setServicesOpen(false);
    setDesktopServicesOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setDesktopServicesOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl supports-[backdrop-filter]:bg-white/85">
    <div className="mx-auto flex min-h-[72px] w-full max-w-[var(--marketing-max-w)] items-center gap-3 px-4 sm:px-6 lg:px-8">
      <Link href="/" className="flex min-h-11 shrink-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200" onClick={() => setOpen(false)} aria-label="KORYXA Service IA & Web — Accueil">
        <BrandLogo className="h-10 w-10 rounded-2xl" />
        <span className="leading-none"><strong className="block text-lg tracking-[-0.04em] text-slate-950">KORYXA</strong><small className="mt-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">Service IA & Web</small></span>
      </Link>
      <nav className="mx-auto hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
        {navItems.map((item) => item.href === "/services" ? <div key={item.href} className="relative" ref={desktopMenuRef} onMouseEnter={() => setDesktopServicesOpen(true)} onMouseLeave={() => setDesktopServicesOpen(false)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDesktopServicesOpen(false); }}>
          <button type="button" onClick={() => setDesktopServicesOpen(value => !value)} aria-expanded={desktopServicesOpen} aria-controls="desktop-services-menu" className={`inline-flex min-h-11 items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 ${active(item.href) ? "bg-white text-[var(--kx-text)]" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}>Services <ChevronDown className={`h-3.5 w-3.5 transition ${desktopServicesOpen ? "rotate-180" : ""}`} /></button>
          {desktopServicesOpen ? <div id="desktop-services-menu" className="absolute left-1/2 top-full w-[min(680px,calc(100vw-3rem))] -translate-x-1/2 pt-4"><div className="grid grid-cols-2 gap-2 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_30px_80px_rgba(15,23,42,0.16)]">{pillars.map((pillar) => <Link key={pillar.slug} href={`/services/${pillar.slug}`} className="rounded-2xl p-4 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"><strong className="block text-sm text-slate-950">{pillar.title}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{pillar.description}</span></Link>)}</div></div> : null}
        </div> : <Link key={item.href} href={item.href} className={`inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 ${active(item.href) ? "bg-white text-[var(--kx-text)]" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}>{item.label}</Link>)}
      </nav>
      <Link href="/demarrer-un-projet" className="ml-auto hidden min-h-11 items-center justify-center rounded-full bg-emerald-400 px-5 text-sm font-bold text-slate-950 shadow-[0_14px_32px_rgba(55,211,138,0.22)] transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 lg:inline-flex">Démarrer un projet</Link>
      <button onClick={() => setOpen(!open)} className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 lg:hidden" aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}>{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
    </div>
    {open ? <div id="mobile-navigation" className="fixed inset-x-0 top-[73px] max-h-[calc(100dvh-73px)] overflow-y-auto overscroll-contain border-t border-slate-200 bg-white px-4 py-4 shadow-2xl lg:hidden"><nav className="mx-auto max-w-[var(--marketing-max-w)]" aria-label="Navigation mobile"><button onClick={() => setServicesOpen(!servicesOpen)} aria-expanded={servicesOpen} aria-controls="mobile-services-menu" className="flex min-h-12 w-full items-center justify-between rounded-2xl bg-slate-50 px-4 py-3.5 text-left font-bold text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200">Services <ChevronDown className={`h-4 w-4 transition ${servicesOpen ? "rotate-180" : ""}`} /></button>{servicesOpen ? <div id="mobile-services-menu" className="mt-2 grid gap-2">{pillars.map((pillar) => <Link onClick={() => setOpen(false)} key={pillar.slug} href={`/services/${pillar.slug}`} className="flex min-h-12 items-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200">{pillar.title}</Link>)}</div> : null}<div className="mt-2 grid gap-1">{navItems.filter(i => i.href !== "/services").map(item => <Link onClick={() => setOpen(false)} key={item.href} href={item.href} className={`flex min-h-12 items-center rounded-2xl px-4 py-3.5 font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 ${active(item.href) ? "bg-white text-[var(--kx-text)]" : "text-slate-700"}`}>{item.label}</Link>)}</div><Link onClick={() => setOpen(false)} href="/demarrer-un-projet" className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-emerald-400 font-bold text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200">Démarrer un projet</Link></nav></div> : null}
  </header>;
}
