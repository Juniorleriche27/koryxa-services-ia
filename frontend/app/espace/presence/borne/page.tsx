"use client";

import React, { useState, useEffect } from "react";
import { DynamicKioskQr } from "@/components/app/DynamicKioskQr";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { useI18n } from "@/lib/i18n";
import { Maximize2, Minimize2, ArrowLeft, Building2, UserCheck, Shield } from "lucide-react";
import Link from "next/link";

export default function AttendanceKioskPage() {
  const { t } = useI18n();
  const [organization, setOrganization] = useState<{ name: string; business_category?: string }>({
    name: "Votre entreprise",
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
    <div className="cauri-members-kiosk min-h-screen flex flex-col justify-between p-4 sm:p-8 select-none">
      {/* Top Kiosk Bar */}
      <header className="cauri-members-kiosk-head flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/espace/presence"
            className="cauri-members-kiosk-back p-2.5 rounded-xl border transition"
            title="Quitter la borne"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="cauri-members-kiosk-icon p-2 rounded-xl border">
              <Building2 size={20} />
            </div>
            <div>
              <h1 className="font-bold text-base text-emerald-950">{organization.name}</h1>
              <p className="text-xs text-emerald-700">{t("attendance_kiosk_title")}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleFullscreen}
            className="cauri-members-kiosk-fullscreen px-4 py-2 rounded-xl border text-xs font-semibold transition flex items-center gap-2 cursor-pointer"
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            <span>{isFullscreen ? t("form_dialog_reduce") : t("form_dialog_fullscreen")}</span>
          </button>
        </div>
      </header>

      {/* Main Centered Kiosk QR */}
      <main className="cauri-members-kiosk-content flex-1 flex flex-col items-center justify-center my-6">
        <DynamicKioskQr
          organizationName={organization.name}
          onCheckInDetected={() => {
            setRecentCheckIn("Pointage enregistré !");
            setTimeout(() => setRecentCheckIn(null), 4000);
          }}
        />

        {recentCheckIn && (
          <div className="mt-4 px-6 py-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm font-bold flex items-center gap-2">
            <UserCheck size={18} />
            <span>{recentCheckIn}</span>
          </div>
        )}
      </main>

      {/* Bottom Footer Info */}
      <footer className="cauri-members-kiosk-foot flex flex-col sm:flex-row items-center justify-between text-xs gap-3 border-t pt-4">
        <div className="flex items-center gap-1.5">
          <Shield size={14} className="text-teal-400" />
          <span>Sécurité cryptographique TOTP (30s) + Verrou Haversine GPS (&lt; 50m)</span>
        </div>
        <span>CAURI · Borne de présence</span>
      </footer>
    </div>
  );
}
