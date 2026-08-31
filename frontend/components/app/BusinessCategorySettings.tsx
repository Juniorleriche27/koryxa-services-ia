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
  Sparkles,
  Building2,
  Shield,
  LocateFixed,
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
        setSuccessMsg("Position GPS capturée avec succès !");
        setTimeout(() => setSuccessMsg(""), 3500);
      },
      (err) => {
        setDetectingGps(false);
        setErrorMsg("Impossible de récupérer la position : " + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      await serviceIaFetch("/organizations/current", {
        method: "PATCH",
        body: JSON.stringify({
          business_category: currentCategory,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          geofence_radius_meters: geofenceRadius,
        }),
      });
      setSuccessMsg("Paramètres métier et localisation mis à jour avec succès !");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (e: any) {
      setErrorMsg(e.message || "Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  const categoriesList = Object.values(BUSINESS_CATEGORIES);

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-7 sm:p-8 shadow-sm space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              <Briefcase size={16} />
            </span>
            <h3 className="text-xl font-extrabold tracking-tight text-slate-950">
              Catégorie Professionnelle & Métier
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Adapte instantanément le vocabulaire de l'IA, les registres et les reçus WhatsApp selon votre secteur d'activité réel.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-black text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition active:scale-98 cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Save size={15} />
          <span>{saving ? "Enregistrement…" : "Enregistrer les modifications"}</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2.5">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-2xl bg-red-50 p-4 border border-red-200 text-xs font-bold text-red-700 flex items-center gap-2.5">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Sectors Grid */}
      <div className="space-y-3">
        <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
          Sélectionnez votre Secteur d'Activité
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoriesList.map((cat) => {
            const isSelected = currentCategory === cat.id;
            return (
              <div
                key={cat.id}
                onClick={() => setCurrentCategory(cat.id)}
                className={`relative flex flex-col justify-between rounded-2xl border-2 p-5 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "border-emerald-600 bg-emerald-50/20 shadow-md ring-2 ring-emerald-500/20"
                    : "border-slate-200/80 bg-slate-50/40 hover:border-slate-300 hover:bg-white"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{cat.emoji}</span>
                      <strong className="text-sm font-extrabold text-slate-900">
                        {cat.shortName}
                      </strong>
                    </div>
                    {isSelected && (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs">
                        <CheckCircle2 size={11} /> Actif
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    {cat.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200/60 flex flex-wrap gap-1.5 text-[10px] font-mono font-bold text-slate-600">
                  <span className="rounded-md bg-white px-2 py-1 border border-slate-200">
                    {cat.registers.offers.title}
                  </span>
                  <span className="rounded-md bg-white px-2 py-1 border border-slate-200">
                    {cat.registers.sales.title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Geofence & Location Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-emerald-600" />
            <h4 className="text-sm font-extrabold text-slate-900">
              Localisation de l'Établissement & Pointage GPS
            </h4>
          </div>
          <button
            type="button"
            onClick={handleDetectGps}
            disabled={detectingGps}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
          >
            <LocateFixed size={13} className={detectingGps ? "animate-spin text-emerald-600" : ""} />
            <span>{detectingGps ? "Détection…" : "Détecter ma position GPS"}</span>
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Ces coordonnées GPS servent à vérifier que vos employés pointent bien physiquement sur les lieux (sécurité anti-triche).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Latitude</label>
            <input
              type="text"
              placeholder="ex: 5.326100"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="w-full text-xs font-mono rounded-xl border border-slate-200 bg-white p-2.5 focus:border-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Longitude</label>
            <input
              type="text"
              placeholder="ex: -4.019700"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="w-full text-xs font-mono rounded-xl border border-slate-200 bg-white p-2.5 focus:border-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Rayon de tolérance</label>
            <select
              value={geofenceRadius}
              onChange={(e) => setGeofenceRadius(Number(e.target.value))}
              className="w-full text-xs rounded-xl border border-slate-200 bg-white p-2.5 focus:border-emerald-500 focus:outline-hidden"
            >
              <option value={30}>30 mètres (Très strict)</option>
              <option value={50}>50 mètres (Recommandé)</option>
              <option value={100}>100 mètres (Grand magasin)</option>
              <option value={200}>200 mètres (Entrepôt / Dépôt)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
