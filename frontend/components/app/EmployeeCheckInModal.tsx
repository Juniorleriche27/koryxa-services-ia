"use client";

import React, { useState, useEffect } from "react";
import {
  UserCheck,
  LogOut,
  MapPin,
  QrCode,
  CheckCircle2,
  AlertCircle,
  X,
  Compass,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { serviceIaFetch } from "@/lib/service-ia/api";

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
  const [actionType, setActionType] = useState<"check-in" | "check-out">("check-in");
  const [employeeName, setEmployeeName] = useState<string>("");
  const [kioskToken, setKioskToken] = useState<string>(defaultToken);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gettingGps, setGettingGps] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [resultData, setResultData] = useState<any | null>(null);

  // Request GPS automatically when modal opens
  useEffect(() => {
    if (open) {
      obtainGps();
    }
  }, [open]);

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
        setGettingGps(false);
      },
      (err) => {
        setGettingGps(false);
        setGpsError("Veuillez autoriser l'accès GPS pour valider votre présence.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName.trim()) {
      setErrorMsg("Veuillez saisir votre nom ou matricule.");
      return;
    }
    if (!kioskToken.trim()) {
      setErrorMsg("Jeton de borne manquant. Veuillez scanner le QR Code.");
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
        kiosk_token: kioskToken.trim(),
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
              <h3 className="font-bold text-foreground text-base">Pointage Employé</h3>
              <p className="text-xs text-muted-foreground">Scan QR Code + Vérification GPS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition"
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
                Pointage Confirmé !
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Employé : <strong>{resultData.employee_name}</strong>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Heure d'arrivée :</span>
                <strong className="font-mono">{resultData.check_in_time || "—"}</strong>
              </div>
              {resultData.check_out_time && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Heure de départ :</span>
                  <strong className="font-mono">{resultData.check_out_time}</strong>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Statut :</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {resultData.status === "late" ? "⚠️ En retard" : "✓ À l'heure"}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-border/40">
                <span className="text-muted-foreground">Validation GPS :</span>
                <span className="font-medium text-foreground">✓ Présence physique validée</span>
              </div>
            </div>

            <button
              onClick={() => {
                setResultData(null);
                setKioskToken("");
                onClose();
              }}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition"
            >
              Terminé
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Check-in / Check-out Tab Toggle */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted rounded-xl">
              <button
                type="button"
                onClick={() => setActionType("check-in")}
                className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                  actionType === "check-in"
                    ? "bg-card text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <UserCheck size={15} />
                <span>Arrivée (Matin)</span>
              </button>

              <button
                type="button"
                onClick={() => setActionType("check-out")}
                className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                  actionType === "check-out"
                    ? "bg-card text-rose-600 dark:text-rose-400 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LogOut size={15} />
                <span>Départ (Soir)</span>
              </button>
            </div>

            {/* Employee Name */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Nom de l'employé / Collaborateur *
              </label>
              <input
                type="text"
                required
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="Ex: Koffi Jean ou Salimata Touré"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            {/* Kiosk TOTP Token */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Jeton de Borne QR (TOTP 30s) *
              </label>
              <div className="relative">
                <QrCode size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={kioskToken}
                  onChange={(e) => setKioskToken(e.target.value)}
                  placeholder="Code lu sur la borne (ex: 8f9b4c2e...)"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-sm font-mono focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            {/* GPS Geofence Status */}
            <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={15} className={latitude ? "text-emerald-600" : "text-amber-600"} />
                <span>
                  {gettingGps
                    ? "Acquisition GPS en cours..."
                    : latitude && longitude
                    ? `Position GPS acquise (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
                    : "Position GPS non détectée"}
                </span>
              </div>
              <button
                type="button"
                onClick={obtainGps}
                disabled={gettingGps}
                className="text-primary hover:underline font-bold"
              >
                Actualiser
              </button>
            </div>

            {gpsError && (
              <p className="text-[11px] text-destructive">{gpsError}</p>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={busy || gettingGps || !employeeName.trim() || !kioskToken.trim()}
                className={`w-full py-3 rounded-xl font-black text-sm text-white shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 ${
                  actionType === "check-in"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                <ShieldCheck size={18} />
                <span>
                  {busy
                    ? "Vérification en cours..."
                    : actionType === "check-in"
                    ? "Valider mon Arrivée"
                    : "Valider mon Départ"}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
