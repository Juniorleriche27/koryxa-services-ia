"use client";

import React, { useState, useEffect } from "react";
import { DynamicKioskQr } from "@/components/app/DynamicKioskQr";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { Maximize2, Minimize2, ArrowLeft, Building2, UserCheck, Shield } from "lucide-react";
import Link from "next/link";

export default function AttendanceKioskPage() {
  const [organization, setOrganization] = useState<{ name: string; business_category?: string }>({
    name: "KORYXA Pointage",
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [recentCheckIn, setRecentCheckIn] = useState<string | null>(null);

  useEffect(() => {
    serviceIaFetch<any>("/organizations/current")
      .then(setOrganization)
      .catch(() => {});
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col justify-between p-4 sm:p-8 select-none">
      {/* Top Kiosk Bar */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/espace/presence"
            className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
            title="Quitter la borne"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Building2 size={20} />
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-100">{organization.name}</h1>
              <p className="text-xs text-slate-400">Borne de Pointage Présences</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleFullscreen}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition flex items-center gap-2"
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            <span>{isFullscreen ? "Quitter Plein Écran" : "Plein Écran"}</span>
          </button>
        </div>
      </header>

      {/* Main Centered Kiosk QR */}
      <main className="flex-1 flex flex-col items-center justify-center my-6">
        <DynamicKioskQr
          organizationName={organization.name}
          onCheckInDetected={() => {
            setRecentCheckIn("Pointage enregistré !");
            setTimeout(() => setRecentCheckIn(null), 4000);
          }}
        />

        {recentCheckIn && (
          <div className="mt-4 px-6 py-3 rounded-2xl bg-emerald-500/20 border border-emerald-500 text-emerald-400 text-sm font-bold animate-bounce flex items-center gap-2">
            <UserCheck size={18} />
            <span>{recentCheckIn}</span>
          </div>
        )}
      </main>

      {/* Bottom Footer Info */}
      <footer className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2 border-t border-slate-900 pt-4">
        <div className="flex items-center gap-1.5">
          <Shield size={14} className="text-teal-400" />
          <span>Sécurité cryptographique TOTP (30s) + Verrou Haversine GPS (&lt; 50m)</span>
        </div>
        <span>KORYXA · Service IA Pointage</span>
      </footer>
    </div>
  );
}
