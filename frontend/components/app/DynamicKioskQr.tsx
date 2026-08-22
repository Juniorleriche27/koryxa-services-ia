"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { RefreshCw, ShieldCheck, Clock, AlertTriangle, Copy, Check, Smartphone } from "lucide-react";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { useI18n } from "@/lib/i18n";

interface KioskTokenResponse {
  token: string;
  step: number;
  expires_in_seconds: number;
  window_seconds: number;
}

export function DynamicKioskQr({
  organizationName = "KORYXA Pointage",
  onCheckInDetected,
}: {
  organizationName?: string;
  onCheckInDetected?: () => void;
}) {
  const { t, lang } = useI18n();
  const [tokenData, setTokenData] = useState<KioskTokenResponse | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  // Live Clock formatted by language locale
  useEffect(() => {
    const localeStr =
      lang === "en" ? "en-US" : lang === "es" ? "es-ES" : lang === "pt" ? "pt-PT" : lang === "ar" ? "ar-SA" : "fr-FR";

    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString(localeStr, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);
    return () => clearInterval(clockInterval);
  }, [lang]);

  // Fetch rotating kiosk token
  const fetchToken = async () => {
    try {
      setError("");
      const res = await serviceIaFetch<KioskTokenResponse>("/attendance/kiosk-token");
      setTokenData(res);
      setTimeLeft(res.expires_in_seconds || 30);

      // Direct URL format so any smartphone camera app immediately opens the check-in page!
      const origin = typeof window !== "undefined" ? window.location.origin : "https://service-ia.koryxa.fr";
      const directScanUrl = `${origin}/espace/presence?scan=${encodeURIComponent(res.token)}`;

      const dataUrl = await QRCode.toDataURL(directScanUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: "#042f2e",
          light: "#ffffff",
        },
      });
      setQrDataUrl(dataUrl);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Erreur de génération du jeton de borne sécurisé");
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchToken();

    // 1-second countdown tick
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          void fetchToken();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleCopyCode = () => {
    if (!tokenData?.token) return;
    navigator.clipboard.writeText(tokenData.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const progressPercent = Math.max(0, Math.min(100, (timeLeft / 30) * 100));
  const localeStr =
    lang === "en" ? "en-US" : lang === "es" ? "es-ES" : lang === "pt" ? "pt-PT" : lang === "ar" ? "ar-SA" : "fr-FR";

  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-10 max-w-lg mx-auto bg-card border-2 border-border rounded-3xl shadow-2xl text-center relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Live Digital Clock */}
      <div className="mb-4">
        <span className="text-3xl sm:text-4xl font-black font-mono tracking-wider text-foreground">
          {currentTime}
        </span>
        <div className="text-xs uppercase font-bold text-muted-foreground tracking-widest mt-1">
          {new Date().toLocaleDateString(localeStr, {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>

      {/* Organization Badge */}
      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-5">
        <ShieldCheck size={15} />
        <span>{t("attendance_kiosk_title")} · {organizationName}</span>
      </div>

      {/* Dynamic QR Display */}
      <div className="relative p-4 rounded-2xl bg-white shadow-inner border border-border/80 mb-4">
        {loading ? (
          <div className="w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] flex flex-col items-center justify-center text-muted-foreground">
            <RefreshCw size={32} className="animate-spin text-primary mb-2" />
            <span className="text-xs font-semibold">{t("common_loading")}</span>
          </div>
        ) : error ? (
          <div className="w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] flex flex-col items-center justify-center text-destructive p-4">
            <AlertTriangle size={32} className="mb-2" />
            <p className="text-xs font-semibold">{error}</p>
            <button
              onClick={fetchToken}
              className="mt-3 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold"
            >
              {t("common_reload")}
            </button>
          </div>
        ) : (
          <img
            src={qrDataUrl}
            alt="Dynamic Attendance QR Code"
            className="w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] object-contain rounded-xl"
          />
        )}

        {/* Security badge */}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-background/90 text-[9px] font-mono text-muted-foreground font-bold shadow">
          TOTP 30s
        </div>
      </div>

      {/* Visible Manual Code Box */}
      {tokenData?.token && (
        <div className="w-full mb-4 p-3 rounded-2xl bg-muted/60 border border-border/80 flex items-center justify-between gap-3">
          <div className="text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Code de pointage direct
            </span>
            <span className="text-lg font-black font-mono tracking-widest text-foreground">
              {tokenData.token}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            className="px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-bold hover:bg-muted transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Copier le code"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            <span>{copied ? "Copié !" : "Copier"}</span>
          </button>
        </div>
      )}

      {/* Countdown Progress Bar */}
      <div className="w-full space-y-2">
        <div className="flex justify-between items-center text-xs font-medium text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock size={13} />
            <span>Renouvellement automatique</span>
          </span>
          <span className="font-mono font-bold text-foreground">{timeLeft}s</span>
        </div>

        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-xs text-muted-foreground flex items-center justify-center gap-2">
        <Smartphone size={15} className="text-primary shrink-0" />
        <span>Scannez avec l&apos;appareil photo de votre smartphone ou l&apos;application KORYXA.</span>
      </div>
    </div>
  );
}
