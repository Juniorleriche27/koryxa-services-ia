"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { useState } from "react";
import BrandLogo from "@/components/layout/BrandLogo";
import { navItems, pillars } from "@/components/marketing/ServiceMarketing";

export default function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  return <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-2xl">
    <div className="mx-auto flex min-h-[72px] w-full max-w-[var(--marketing-max-w)] items-center gap-4 px-4 sm:px-6 lg:px-8">
      <Link href="/" className="flex shrink-0 items-center gap-3" onClick={() => setOpen(false)}><BrandLogo className="h-10 w-10 rounded-2xl" /><span className="leading-none"><strong className="block text-lg tracking-[-0.04em] text-slate-950">KORYXA</strong><small className="mt-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-700">Service IA & Web</small></span></Link>
      <nav className="mx-auto hidden items-center gap-1 lg:flex">{navItems.map((item) => item.href === "/services" ? <div key={item.href} className="group relative"><Link href={item.href} className={`inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold transition ${active(item.href) ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}>Services <ChevronDown className="h-3.5 w-3.5" /></Link><div className="invisible absolute left-1/2 top-full w-[680px] -translate-x-1/2 pt-4 opacity-0 transition group-hover:visible group-hover:opacity-100"><div className="grid grid-cols-2 gap-2 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_30px_80px_rgba(15,23,42,0.16)]">{pillars.map((pillar) => <Link key={pillar.slug} href={`/services#${pillar.slug}`} className="rounded-2xl p-4 transition hover:bg-cyan-50"><strong className="block text-sm text-slate-950">{pillar.title}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{pillar.description}</span></Link>)}</div></div></div> : <Link key={item.href} href={item.href} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${active(item.href) ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}>{item.label}</Link>)}</nav>
      <Link href="/demarrer-un-projet" className="ml-auto hidden min-h-11 items-center justify-center rounded-full bg-cyan-400 px-5 text-sm font-bold text-slate-950 shadow-[0_14px_32px_rgba(34,211,238,0.22)] transition hover:bg-cyan-300 lg:inline-flex">Démarrer un projet</Link>
      <button onClick={() => setOpen(!open)} className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-800 lg:hidden" aria-expanded={open} aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}>{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
    </div>
    {open ? <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden"><div className="mx-auto max-w-[var(--marketing-max-w)]"><button onClick={() => setServicesOpen(!servicesOpen)} className="flex w-full items-center justify-between rounded-2xl bg-slate-50 px-4 py-3.5 text-left font-bold text-slate-950">Services <ChevronDown className={`h-4 w-4 transition ${servicesOpen ? "rotate-180" : ""}`} /></button>{servicesOpen ? <div className="mt-2 grid gap-2 pl-2">{pillars.map((pillar) => <Link onClick={() => setOpen(false)} key={pillar.slug} href={`/services#${pillar.slug}`} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">{pillar.title}</Link>)}</div> : null}<div className="mt-2 grid gap-2">{navItems.filter(i => i.href !== "/services").map(item => <Link onClick={() => setOpen(false)} key={item.href} href={item.href} className={`rounded-2xl px-4 py-3.5 font-semibold ${active(item.href) ? "bg-slate-950 text-white" : "text-slate-700"}`}>{item.label}</Link>)}</div><Link onClick={() => setOpen(false)} href="/demarrer-un-projet" className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-cyan-400 font-bold text-slate-950">Démarrer un projet</Link></div></div> : null}
  </header>;
}
