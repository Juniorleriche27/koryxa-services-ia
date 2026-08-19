"use client";

import React, { useState, useEffect } from "react";
import {
  Store,
  Briefcase,
  Utensils,
  Scissors,
  Users,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Save,
  Compass,
} from "lucide-react";
import { serviceIaFetch } from "@/lib/service-ia/api";
import {
  BUSINESS_CATEGORIES,
  BusinessCategory,
  getBusinessCategoryConfig,
} from "@/lib/service-ia/business-categories";

export function BusinessCategorySettings() {
  const [currentCategory, setCurrentCategory] = useState<BusinessCategory>("retail");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [geofenceRadius, setGeofenceRadius] = useState<number>(50);
  const [saving, setSaving] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    serviceIaFetch<{
      business_category?: string;
      latitude?: number | null;
      longitude?: number | null;
      geofence_radius_meters?: number;
    }>("/organizations/current")
      .then((org) => {
        if (org.business_category && org.business_category in BUSINESS_CATEGORIES) {
          setCurrentCategory(org.business_category as BusinessCategory);
        }
        if (org.latitude !== undefined && org.latitude !== null) {
          setLatitude(String(org.latitude));
        }
        if (org.longitude !== undefined && org.longitude !== null) {
          setLongitude(String(org.longitude));
        }
        if (org.geofence_radius_meters) {
          setGeofenceRadius(org.geofence_radius_meters);
        }
      })
      .catch(() => {});
  }, []);

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setErrorMsg("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }
    setDetectingGps(true);
    setErrorMsg("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setDetectingGps(false);
        setSuccessMsg("Position GPS détectée avec succès ! Pensez à enregistrer.");
        setTimeout(() => setSuccessMsg(""), 4000);
      },
      (err) => {
        setDetectingGps(false);
        setErrorMsg("Impossible de récupérer la position GPS. Autorisez l'accès à la position.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const updatedOrg = await serviceIaFetch<any>("/organizations/current", {
        method: "PATCH",
        body: JSON.stringify({
          business_category: currentCategory,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          geofence_radius_meters: geofenceRadius,
        }),
      });

      // Dispatch global event so AppShell and other sections re-render
      window.dispatchEvent(
        new CustomEvent("koryxa:organization-updated", { detail: updatedOrg })
      );

      setSuccessMsg("Profil professionnel et localisation enregistrés avec succès !");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de l'enregistrement des paramètres.");
    } finally {
      setSaving(false);
    }
  };

  const categoriesList = Object.values(BUSINESS_CATEGORIES);
  const activeConfig = getBusinessCategoryConfig(currentCategory);

  return (
    <section className="app-panel mb-8 p-6 rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{activeConfig.emoji}</span>
            <h3 className="text-xl font-bold text-foreground">
              Catégorie Professionnelle & Métier
            </h3>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Adapte instantanément les registres, les termes, les fiches et les contrôles à votre secteur d'activité réel.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition disabled:opacity-50"
        >
          <Save size={16} />
          <span>{saving ? "Enregistrement..." : "Enregistrer les modifications"}</span>
        </button>
      </div>

      {successMsg && (
        <div className="mt-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mt-4 p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid of 5 Professional Categories */}
      <div className="mt-6">
        <label className="text-xs font-bold tracking-wider uppercase text-muted-foreground mb-3 block">
          Sélectionnez votre Catégorie Professionnelle
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {categoriesList.map((cat) => {
            const isSelected = currentCategory === cat.id;
            return (
              <div
                key={cat.id}
                onClick={() => setCurrentCategory(cat.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border/60 hover:border-border hover:bg-muted/30"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{cat.emoji}</span>
                      <strong className="text-sm font-semibold text-foreground">
                        {cat.shortName}
                      </strong>
                    </div>
                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold">
                        Actif
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {cat.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground flex flex-wrap gap-1.5">
                  <span className="bg-muted px-1.5 py-0.5 rounded font-mono">
                    {cat.registers.offers.title}
                  </span>
                  <span className="bg-muted px-1.5 py-0.5 rounded font-mono">
                    {cat.registers.sales.title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Physical Establishment Location & Geofencing */}
      <div className="mt-8 pt-6 border-t border-border">
        <div className="flex items-center gap-2 mb-2">
          <MapPin size={18} className="text-primary" />
          <h4 className="text-base font-bold text-foreground">
            Localisation de l'Établissement (Verrou Pointage GPS)
          </h4>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Ces coordonnées GPS servent à vérifier que vos employés pointent bien physiquement sur les lieux (anti-triche à distance).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Latitude
            </label>
            <input
              type="text"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="Ex: 5.326100"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Longitude
            </label>
            <input
              type="text"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="Ex: -4.019700"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Rayon de tolérance (mètres)
            </label>
            <select
              value={geofenceRadius}
              onChange={(e) => setGeofenceRadius(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium"
            >
              <option value={30}>30 mètres (Très strict)</option>
              <option value={50}>50 mètres (Recommandé)</option>
              <option value={100}>100 mètres (Grand bâtiment / Entrepôt)</option>
              <option value={250}>250 mètres (Zone industrielle étendue)</option>
            </select>
          </div>
        </div>

        <div className="mt-3.5 flex items-center gap-3">
          <button
            type="button"
            onClick={handleDetectGps}
            disabled={detectingGps}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/50 hover:bg-muted text-xs font-medium text-foreground transition disabled:opacity-50"
          >
            <Compass size={14} />
            <span>{detectingGps ? "Détection en cours..." : "📍 Détecter ma position GPS actuelle"}</span>
          </button>
          {latitude && longitude && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              ✓ Coordonnées prêtes : ({latitude}, {longitude})
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
