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
  Compass,
  HelpCircle,
  Lock,
  Sparkles,
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
  const [tab, setTab] = useState<"scan" | "manual">("manual");
  const [actionType, setActionType] = useState<"check-in" | "check-out">("check-in");
  const [employeeName, setEmployeeName] = useState<string>("");
  const [kioskToken, setKioskToken] = useState<string>(defaultToken);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [gettingGps, setGettingGps] = useState<boolean>(false);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "requesting" | "granted" | "denied">("idle");
  const [gpsError, setGpsError] = useState<string>("");
  const [showGpsHelp, setShowGpsHelp] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [resultData, setResultData] = useState<any | null>(null);
  const [scannedSuccess, setScannedSuccess] = useState<boolean>(false);

  // Camera video and canvas refs for live jsQR scanning
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);
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

  // Handle camera start / stop when tab changes
  useEffect(() => {
    if (open && tab === "scan" && !resultData) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [open, tab, resultData]);

  // Robust Geolocation
  const obtainGps = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGpsError("La géolocalisation n'est pas supportée sur cet appareil.");
      setGpsStatus("denied");
      setGettingGps(false);
      return;
    }

    setGettingGps(true);
    setGpsStatus("requesting");
    setGpsError("");

    const safetyTimer = setTimeout(() => {
      setGettingGps(false);
    }, 5000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(safetyTimer);
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setAccuracy(Math.round(pos.coords.accuracy));
        setGpsStatus("granted");
        setGettingGps(false);
        setGpsError("");
      },
      (err) => {
        navigator.geolocation.getCurrentPosition(
          (fallbackPos) => {
            clearTimeout(safetyTimer);
            setLatitude(fallbackPos.coords.latitude);
            setLongitude(fallbackPos.coords.longitude);
            setAccuracy(Math.round(fallbackPos.coords.accuracy));
            setGpsStatus("granted");
            setGettingGps(false);
            setGpsError("");
          },
          (fallbackErr) => {
            clearTimeout(safetyTimer);
            setGettingGps(false);
            setGpsStatus("denied");
            if (err.code === 1) {
              setGpsError("Accès GPS refusé. Veuillez autoriser l'accès localisation.");
            } else if (err.code === 2) {
              setGpsError("Position indisponible. Activez le GPS dans les réglages du smartphone.");
            } else {
              setGpsError("Délai GPS dépassé. Cliquez sur 'Autoriser' pour réessayer.");
            }
          },
          { enableHighAccuracy: false, timeout: 4000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 4000, maximumAge: 30000 }
    );
  };

  const startCamera = async () => {
    setCameraError("");
    setCameraActive(false);
    setCameraLoading(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("L'accès à la caméra n'est pas supporté par ce navigateur.");
        setCameraLoading(false);
        return;
      }

      let stream: MediaStream;
      try {
        // Try rear environment camera first (ideal for mobile QR scanning)
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });
      } catch {
        // Fallback to any camera (webcam, front camera)
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        setCameraActive(true);
        setCameraLoading(false);
        scanFrame();
      }
    } catch (err: any) {
      console.warn("Camera init failed:", err);
      setCameraLoading(false);
      setCameraError("Accès caméra refusé ou non disponible. Veuillez autoriser la caméra ou utiliser la saisie du code manuel.");
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
    setCameraLoading(false);
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
        setScannedSuccess(true);
        stopCamera();
        setTab("manual");
        setTimeout(() => setScannedSuccess(false), 4000);
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!employeeName.trim()) {
      setErrorMsg("Veuillez renseigner votre nom ou identifiant collaborateur.");
      return;
    }
    if (!kioskToken.trim()) {
      setErrorMsg("Code de borne manquant : veuillez renseigner le code à 8 caractères affiché sur la borne (ex: 2C1880BA) ou scanner le QR code.");
      return;
    }

    setBusy(true);
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
      setErrorMsg(err.message || "Échec de validation du pointage. Veuillez vérifier le code de la borne.");
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
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
            aria-label="Fermer"
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
                  TOTP + Position validées
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:bg-primary/90 transition cursor-pointer"
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
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px] ${
                  actionType === "check-in"
                    ? "bg-card text-foreground shadow-xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <UserCheck size={15} className={actionType === "check-in" ? "text-emerald-500" : ""} />
                <span>Arrivée (Check-In)</span>
              </button>
              <button
                type="button"
                onClick={() => setActionType("check-out")}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px] ${
                  actionType === "check-out"
                    ? "bg-card text-foreground shadow-xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LogOut size={15} className={actionType === "check-out" ? "text-amber-500" : ""} />
                <span>Départ (Check-Out)</span>
              </button>
            </div>

            {/* Mode Tabs: Scanner Caméra vs Code Manuel */}
            <div className="grid grid-cols-2 gap-2 border-b border-border/80 pb-3">
              <button
                type="button"
                onClick={() => setTab("scan")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px] ${
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
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px] ${
                  tab === "manual"
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <KeyRound size={14} />
                <span>Code Manuel</span>
              </button>
            </div>

            {scannedSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
                <CheckCircle2 size={16} />
                <span>Code borne capté avec succès : {kioskToken} !</span>
              </div>
            )}

            {/* Camera Viewfinder Screen */}
            {tab === "scan" ? (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video max-h-[220px] mx-auto flex items-center justify-center border-2 border-primary/40 shadow-inner">
                  {cameraLoading && (
                    <div className="flex flex-col items-center justify-center text-slate-300 gap-2">
                      <RefreshCw size={24} className="animate-spin text-emerald-400" />
                      <span className="text-xs font-semibold">Activation de la caméra…</span>
                    </div>
                  )}

                  <video ref={videoRef} className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`} />
                  <canvas ref={canvasRef} className="hidden" />

                  {cameraActive && (
                    <>
                      {/* Animated Viewfinder Box */}
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-36 h-36 border-2 border-emerald-400/90 rounded-2xl animate-pulse flex items-center justify-center shadow-lg">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                        </div>
                      </div>
                      <div className="absolute bottom-2 px-3 py-1 rounded-full bg-black/70 text-[10px] text-white font-medium backdrop-blur-xs flex items-center gap-1.5">
                        <Sparkles size={12} className="text-emerald-400" />
                        <span>Visez le QR code de la borne</span>
                      </div>
                    </>
                  )}
                </div>

                {cameraError && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-2">
                    <p className="font-semibold">{cameraError}</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-bold cursor-pointer"
                      >
                        Réessayer
                      </button>
                      <button
                        type="button"
                        onClick={() => setTab("manual")}
                        className="px-3 py-1 rounded-lg bg-card border border-border text-foreground text-xs font-bold cursor-pointer"
                      >
                        Saisir le code
                      </button>
                    </div>
                  </div>
                )}
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
                    placeholder="Ex: 2C1880BA"
                    className="w-full p-3.5 pl-10 rounded-2xl border border-border bg-card font-mono text-base font-black tracking-widest text-foreground focus:ring-2 focus:ring-primary focus:outline-hidden"
                  />
                  <QrCode size={18} className="absolute left-3.5 top-4 text-muted-foreground pointer-events-none" />
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
                  placeholder="Ex: Yayra Junior LAMADOKOU"
                  className="w-full p-3.5 pl-10 rounded-2xl border border-border bg-card text-sm font-semibold text-foreground focus:ring-2 focus:ring-primary focus:outline-hidden"
                />
                <Users size={18} className="absolute left-3.5 top-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Professional GPS Status Card */}
            <div className={`p-3.5 rounded-2xl border transition-all ${
              latitude
                ? "bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-950/20"
                : "bg-muted/60 border-border/80"
            }`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      latitude
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        : gettingGps
                        ? "bg-primary/10 text-primary"
                        : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    <MapPin size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-foreground block truncate">
                      {latitude
                        ? "Position GPS Confirmée"
                        : gettingGps
                        ? "Détection de votre position…"
                        : "Vérification de Présence GPS"}
                    </span>
                    <span className={`text-[11px] block truncate ${latitude ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground"}`}>
                      {latitude
                        ? `Précision vérifiée (±${accuracy || 8} mètres)`
                        : "Requis pour prouver la présence physique"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={obtainGps}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs active:scale-95 ${
                    latitude
                      ? "bg-card border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white font-black"
                  }`}
                >
                  {gettingGps ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Détection…</span>
                    </>
                  ) : latitude ? (
                    <>
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      <span>Confirmé</span>
                    </>
                  ) : (
                    <>
                      <Compass size={13} />
                      <span>Autoriser GPS</span>
                    </>
                  )}
                </button>
              </div>

              {gpsError && !latitude && (
                <div className="mt-2 pt-2 border-t border-border/60 text-[11px] text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span>{gpsError}</span>
                    <button
                      type="button"
                      onClick={() => setShowGpsHelp((prev) => !prev)}
                      className="ml-1.5 underline font-bold text-primary inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <HelpCircle size={11} /> Comment débloquer ?
                    </button>
                  </div>
                </div>
              )}

              {showGpsHelp && (
                <div className="mt-2 p-3 rounded-xl bg-card border border-border/80 text-[11px] text-muted-foreground space-y-1.5 animate-in fade-in duration-150">
                  <div className="font-bold text-foreground flex items-center gap-1">
                    <Lock size={12} className="text-primary" />
                    <span>Pour autoriser la localisation :</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 pl-1">
                    <li>Touchez l&apos;icône 🔒 à gauche de l&apos;adresse web</li>
                    <li>Appuyez sur <strong>Autorisations</strong> ou <strong>Position</strong></li>
                    <li>Sélectionnez <strong>Autoriser</strong> puis cliquez sur &quot;Autoriser GPS&quot;</li>
                  </ol>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={busy}
              className="w-full py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
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
