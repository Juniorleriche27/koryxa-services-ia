"use client";

import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { RefreshCw, ShieldCheck, Clock, AlertTriangle } from "lucide-react";
import { serviceIaFetch } from "@/lib/service-ia/api";

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
  const [tokenData, setTokenData] = useState<KioskTokenResponse | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<string>("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Live Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Fetch rotating kiosk token
  const fetchToken = async () => {
    try {
      setError("");
      const res = await serviceIaFetch<KioskTokenResponse>("/attendance/kiosk-token");
      setTokenData(res);
      setTimeLeft(res.expires_in_seconds || 30);

      // Generate QR Code data payload
      // Format: koryxa-attendance://check-in?token=<token>&step=<step>
      const qrPayload = JSON.stringify({
        type: "koryxa-attendance",
        token: res.token,
        step: res.step,
        timestamp: Date.now(),
      });

      const dataUrl = await QRCode.toDataURL(qrPayload, {
        width: 380,
        margin: 2,
        color: {
          dark: "#042f2e",
          light: "#ffffff",
        },
      });
      setQrDataUrl(dataUrl);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Erreur de génération du jeton sécurisé");
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

  const progressPercent = Math.max(0, Math.min(100, (timeLeft / 30) * 100));

  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-10 max-w-lg mx-auto bg-card border-2 border-border rounded-3xl shadow-2xl text-center relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Live Digital Clock */}
      <div className="mb-4">
        <span className="text-3xl sm:text-4xl font-black font-mono tracking-wider text-foreground">
          {currentTime}
        </span>
        <div className="text-xs uppercase font-bold text-muted-foreground tracking-widest mt-1">
          {new Date().toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>

      {/* Organization Badge */}
      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-6">
        <ShieldCheck size={15} />
        <span>Borne Officielle · {organizationName}</span>
      </div>

      {/* Dynamic QR Display */}
      <div className="relative p-4 rounded-2xl bg-white shadow-inner border border-border/80 mb-6">
        {loading ? (
          <div className="w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] flex flex-col items-center justify-center text-muted-foreground">
            <RefreshCw size={32} className="animate-spin text-primary mb-2" />
            <span className="text-xs font-semibold">Génération du QR Code...</span>
          </div>
        ) : error ? (
          <div className="w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] flex flex-col items-center justify-center text-destructive p-4">
            <AlertTriangle size={32} className="mb-2" />
            <p className="text-xs font-semibold">{error}</p>
            <button
              onClick={fetchToken}
              className="mt-3 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold"
            >
              Réessayer
            </button>
          </div>
        ) : (
          <img
            src={qrDataUrl}
            alt="QR Code de pointage dynamique"
            className="w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] object-contain rounded-xl"
          />
        )}

        {/* Security watermark badge */}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-background/90 text-[9px] font-mono text-muted-foreground font-bold shadow">
          TOTP 30s
        </div>
      </div>

      {/* Countdown Progress Bar */}
      <div className="w-full space-y-2">
        <div className="flex justify-between items-center text-xs font-medium text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock size={13} />
            <span>Renouvellement anti-capture</span>
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
      <p className="text-xs text-muted-foreground mt-5 leading-relaxed">
        Scannez ce QR Code avec l&apos;application mobile KORYXA de votre smartphone. Vous devez être présent sur place (GPS vérifié).
      </p>
    </div>
  );
}
