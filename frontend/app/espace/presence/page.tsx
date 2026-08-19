"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusPill, EmptyState } from "@/components/app/Ui";
import { EmployeeCheckInModal } from "@/components/app/EmployeeCheckInModal";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { getBusinessCategoryConfig } from "@/lib/service-ia/business-categories";
import {
  UserCheck,
  QrCode,
  Clock,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  LogOut,
  ExternalLink,
  Users,
} from "lucide-react";
import Link from "next/link";

interface AttendanceRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  date: string;
  check_in_time?: string | null;
  check_out_time?: string | null;
  check_in_lat?: number | null;
  check_in_lng?: number | null;
  status: "present" | "late" | "absent";
  verified_by: string;
  notes?: string | null;
  created_at: string;
}

interface AttendanceTodaySummary {
  date: string;
  total_present: number;
  total_late: number;
  total_checked_out: number;
  records: AttendanceRecord[];
}

export default function PresencePage() {
  const [data, setData] = useState<AttendanceTodaySummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [checkInOpen, setCheckInOpen] = useState<boolean>(false);
  const [businessCategory, setBusinessCategory] = useState<string>("retail");

  const loadData = async () => {
    try {
      setError("");
      const summary = await serviceIaFetch<AttendanceTodaySummary>("/attendance/today");
      setData(summary);
    } catch (err: any) {
      setError(err.message || "Impossible de charger les pointages du jour");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();

    serviceIaFetch<any>("/organizations/current")
      .then((org) => {
        if (org.business_category) setBusinessCategory(org.business_category);
      })
      .catch(() => {});
  }, []);

  const proConfig = getBusinessCategoryConfig(businessCategory);

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          eyebrow={proConfig.badge}
          title={proConfig.registers.attendance.title}
          description={proConfig.registers.attendance.subtitle}
          action={
            <div className="kx-header-actions-row">
              <Link
                href="/espace/presence/borne"
                target="_blank"
                className="app-button app-button-secondary inline-flex items-center gap-2"
                title="Lancer l'écran borne QR Code dynamique pour tablette ou écran boutique"
              >
                <QrCode size={16} className="text-teal-600 dark:text-teal-400" />
                <span>Borne Écran Magasin</span>
                <ExternalLink size={13} className="opacity-60" />
              </Link>

              <button
                type="button"
                onClick={() => setCheckInOpen(true)}
                className="app-button app-button-primary inline-flex items-center gap-2"
              >
                <UserCheck size={16} />
                <span>Pointer Maintenant</span>
              </button>
            </div>
          }
        />

        {/* Daily KPI Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <UserCheck size={24} />
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground block">
                Présents aujourd'hui
              </span>
              <strong className="text-2xl font-black font-mono text-foreground">
                {data?.total_present ?? 0}
              </strong>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock size={24} />
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground block">
                Arrivées en retard
              </span>
              <strong className="text-2xl font-black font-mono text-foreground">
                {data?.total_late ?? 0}
              </strong>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <LogOut size={24} />
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground block">
                Départs enregistrés
              </span>
              <strong className="text-2xl font-black font-mono text-foreground">
                {data?.total_checked_out ?? 0}
              </strong>
            </div>
          </div>
        </div>

        {/* Attendance Table Panel */}
        <section className="app-panel">
          <div className="app-panel-head flex items-center justify-between">
            <div>
              <h2>Pointages du Jour ({new Date().toLocaleDateString("fr-FR")})</h2>
              <p className="text-xs text-muted-foreground">
                Horaires d'arrivée, départs et conformité géographique GPS.
              </p>
            </div>
            <button
              onClick={() => void loadData()}
              className="app-button app-button-secondary text-xs"
            >
              Actualiser
            </button>
          </div>

          {loading && (
            <EmptyState title="Chargement…" detail="Récupération des présences du jour." />
          )}

          {error && <EmptyState title="Données indisponibles" detail={error} />}

          {!loading && !error && (!data?.records || data.records.length === 0) && (
            <EmptyState
              title="Aucun pointage aujourd'hui"
              detail="Aucun collaborateur n'a encore pointé sa présence aujourd'hui."
            />
          )}

          {!loading && data?.records && data.records.length > 0 && (
            <div className="app-table-scroll kx-rich-table-scroll">
              <table className="app-data-table kx-rich-table">
                <thead>
                  <tr>
                    <th>Employé / Collaborateur</th>
                    <th>Arrivée (Matin)</th>
                    <th>Départ (Soir)</th>
                    <th>Statut</th>
                    <th>Vérification GPS</th>
                    <th>Sécurité</th>
                  </tr>
                </thead>
                <tbody>
                  {data.records.map((record) => (
                    <tr key={record.id}>
                      <td>
                        <strong className="text-foreground">{record.employee_name}</strong>
                        <div className="text-xs text-muted-foreground font-mono">
                          {record.employee_id}
                        </div>
                      </td>
                      <td>
                        <span className="font-mono font-bold text-foreground">
                          {record.check_in_time ? `🕒 ${record.check_in_time}` : "—"}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono font-medium text-foreground">
                          {record.check_out_time ? `🚪 ${record.check_out_time}` : "En poste"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            record.status === "late"
                              ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                          }`}
                        >
                          {record.status === "late" ? "⚠️ En retard" : "✓ À l'heure"}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          <MapPin size={14} />
                          <span>Périmètre validé (&lt; 50m)</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <ShieldCheck size={14} className="text-primary" />
                          <span>QR TOTP + GPS</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Employee Check-in Modal */}
        <EmployeeCheckInModal
          open={checkInOpen}
          onClose={() => setCheckInOpen(false)}
          onSuccess={async () => {
            await loadData();
          }}
        />
      </div>
    </>
  );
}
