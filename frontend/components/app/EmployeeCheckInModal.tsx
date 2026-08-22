"use client";

import React, { useState, useEffect, useRef } from "react";
import jsQR from "jsqr";
import {
  UserCheck,
  LogOut,
  MapPin,
  QrCode,
  CheckCircle2,
  AlertCircle,
  X,
  Camera,
  RefreshCw,
  Clock,
  ShieldCheck,
  Users,
  KeyRound,
} from "lucide-react";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@clerk/nextjs";

interface EmployeeCheckInModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => Promise<void>;
  defaultToken?: string;
}

export function EmployeeCheckInModal({
  open,
  onClose,
  onSuccess,
  defaultToken = "",
}: EmployeeCheckInModalProps) {
  const { t, lang } = useI18n();
  const { user } = useUser();
  const [tab, setTab] = useState<"scan" | "manual">("scan");
  const [actionType, setActionType] = useState<"check-in" | "check-out">("check-in");
  const [employeeName, setEmployeeName] = useState<string>("");
  const [kioskToken, setKioskToken] = useState<string>(defaultToken);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [gettingGps, setGettingGps] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [resultData, setResultData] = useState<any | null>(null);

  // Camera video and canvas refs for live jsQR scanning
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>("");
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Auto-fill employee name from Clerk user
  useEffect(() => {
    if (user?.fullName) {
      setEmployeeName(user.fullName);
    } else if (user?.primaryEmailAddress?.emailAddress) {
      setEmployeeName(user.primaryEmailAddress.emailAddress.split("@")[0]);
    }
  }, [user]);

  // Synchronize token if defaultToken prop changes
  useEffect(() => {
    if (defaultToken) {
      setKioskToken(defaultToken);
      setTab("manual");
    }
  }, [defaultToken]);

  // Request GPS automatically when modal opens
  useEffect(() => {
    if (open) {
      obtainGps();
    } else {
      stopCamera();
    }
  }, [open]);

  // Start camera when on scan tab
  useEffect(() => {
    if (open && tab === "scan" && !resultData) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [open, tab, resultData]);

  const obtainGps = () => {
    if (!navigator.geolocation) {
      setGpsError("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }
    setGettingGps(true);
    setGpsError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setAccuracy(Math.round(pos.coords.accuracy));
        setGettingGps(false);
      },
      (err) => {
        setGettingGps(false);
        setGpsError("Veuillez autoriser l'accès GPS pour valider votre présence sur place.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const startCamera = async () => {
    setCameraError("");
    setCameraActive(false);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          await videoRef.current.play();
          setCameraActive(true);
          scanFrame();
        }
      } else {
        setCameraError("Caméra non accessible. Veuillez saisir le code manuellement.");
        setTab("manual");
      }
    } catch (err: any) {
      setCameraError("Impossible d'activer la caméra. Utilisez la saisie manuelle.");
      setTab("manual");
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code && code.data) {
        // Parse token from either URL ?scan=TOKEN, JSON payload, or raw token string
        let extractedToken = code.data.trim();
        if (extractedToken.includes("scan=")) {
          const match = extractedToken.match(/scan=([^&]+)/);
          if (match && match[1]) extractedToken = decodeURIComponent(match[1]);
        } else if (extractedToken.includes('"token":')) {
          try {
            const parsed = JSON.parse(extractedToken);
            if (parsed.token) extractedToken = parsed.token;
          } catch {}
        }

        setKioskToken(extractedToken.toUpperCase());
        stopCamera();
        setTab("manual");
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName.trim()) {
      setErrorMsg("Veuillez renseigner votre nom ou identifiant collaborateur.");
      return;
    }
    if (!kioskToken.trim()) {
      setErrorMsg("Jeton de borne manquant. Veuillez scanner le QR Code ou saisir le code affiché.");
      return;
    }

    setBusy(true);
    setErrorMsg("");
    setResultData(null);

    try {
      const endpoint = actionType === "check-in" ? "/attendance/check-in" : "/attendance/check-out";
      const payload: Record<string, unknown> = {
        employee_name: employeeName.trim(),
        employee_id: `emp-${employeeName.trim().toLowerCase().replace(/\s+/g, "-")}`,
        token: kioskToken.trim().toUpperCase(),
        latitude: latitude,
        longitude: longitude,
      };

      const res = await serviceIaFetch<any>(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setResultData(res);
      if (onSuccess) await onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || "Échec de validation du pointage");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
              <UserCheck size={20} />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-base">Pointage Équipe Sécurisé</h3>
              <p className="text-xs text-muted-foreground">Scan QR Code dynamique + Contrôle GPS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {resultData ? (
          /* Success Screen */
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center animate-bounce">
              <CheckCircle2 size={36} />
            </div>
            <div>
              <h4 className="text-xl font-black text-foreground">
                {actionType === "check-in" ? "Arrivée Confirmée !" : "Départ Confirmé !"}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Collaborateur : <strong>{resultData.employee_name}</strong>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date :</span>
                <strong className="text-foreground">{resultData.date}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {actionType === "check-in" ? "Heure d'arrivée :" : "Heure de départ :"}
                </span>
                <strong className="text-foreground font-mono">
                  {new Date(resultData.check_in_time || resultData.check_out_time || Date.now()).toLocaleTimeString()}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Statut :</span>
                <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 uppercase">
                  {resultData.status || "Validé"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sécurité :</span>
                <span className="text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1">
                  <ShieldCheck size={12} />
                  TOTP + GPS validés
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:bg-primary/90 transition cursor-pointer"
            >
              Terminer
            </button>
          </div>
        ) : (
          /* Check-In Form */
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Action Type Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-muted border border-border">
              <button
                type="button"
                onClick={() => setActionType("check-in")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  actionType === "check-in"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <UserCheck size={14} className={actionType === "check-in" ? "text-emerald-500" : ""} />
                <span>Arrivée (Check-In)</span>
              </button>
              <button
                type="button"
                onClick={() => setActionType("check-out")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  actionType === "check-out"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LogOut size={14} className={actionType === "check-out" ? "text-amber-500" : ""} />
                <span>Départ (Check-Out)</span>
              </button>
            </div>

            {/* Mode Tabs: Live Scanner vs Manual Code */}
            <div className="flex items-center justify-center gap-2 border-b border-border/80 pb-3">
              <button
                type="button"
                onClick={() => setTab("scan")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  tab === "scan"
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Camera size={14} />
                <span>Scanner Caméra</span>
              </button>
              <button
                type="button"
                onClick={() => setTab("manual")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  tab === "manual"
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <KeyRound size={14} />
                <span>Code Manuel</span>
              </button>
            </div>

            {/* Live Camera Scanner Box */}
            {tab === "scan" ? (
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-square max-h-[220px] mx-auto flex items-center justify-center border-2 border-primary/40 shadow-inner">
                <video ref={videoRef} className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />

                {/* Viewfinder Target Graphic */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-36 h-36 border-2 border-emerald-400/80 rounded-2xl animate-pulse flex items-center justify-center">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                  </div>
                </div>

                <div className="absolute bottom-2 px-3 py-1 rounded-full bg-black/60 text-[10px] text-white font-medium backdrop-blur-xs flex items-center gap-1.5">
                  <Camera size={12} className="text-emerald-400" />
                  <span>Pointez la caméra vers l&apos;écran de la borne</span>
                </div>
              </div>
            ) : (
              /* Manual Token Input */
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                  Code Borne Sécurisé (TOTP 30s) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={kioskToken}
                    onChange={(e) => setKioskToken(e.target.value.toUpperCase())}
                    placeholder="Ex: 8D4F-1A2B"
                    className="w-full p-3 pl-10 rounded-2xl border border-border bg-card font-mono text-base font-black tracking-widest text-foreground focus:ring-2 focus:ring-primary focus:outline-hidden"
                    required
                  />
                  <QrCode size={18} className="absolute left-3.5 top-3.5 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            )}

            {/* Employee Name */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                Nom du Collaborateur / Identifiant *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  placeholder="Ex: Paul Koffi"
                  className="w-full p-3 pl-10 rounded-2xl border border-border bg-card text-sm font-semibold text-foreground focus:ring-2 focus:ring-primary focus:outline-hidden"
                  required
                />
                <Users size={18} className="absolute left-3.5 top-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* GPS Geofence Status Badge */}
            <div className="p-3 rounded-2xl bg-muted/60 border border-border/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <MapPin size={16} className={latitude ? "text-emerald-500" : "text-amber-500"} />
                <div>
                  <span className="font-semibold block text-foreground">
                    {gettingGps
                      ? "Acquisition GPS en cours…"
                      : latitude
                      ? `Position GPS validée (±${accuracy}m)`
                      : "GPS non détecté"}
                  </span>
                  {gpsError && <span className="text-[10px] text-destructive block">{gpsError}</span>}
                </div>
              </div>
              <button
                type="button"
                onClick={obtainGps}
                disabled={gettingGps}
                className="px-2.5 py-1 rounded-xl bg-card border border-border text-[11px] font-bold hover:bg-muted transition cursor-pointer"
              >
                {gettingGps ? <RefreshCw size={12} className="animate-spin" /> : "Actualiser"}
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={busy || gettingGps || !kioskToken.trim()}
              className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:bg-primary/90 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {busy ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Validation du pointage…</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>
                    {actionType === "check-in" ? "Valider mon Arrivée" : "Valider mon Départ"}
                  </span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
