"use client";

import React, { useState, useEffect, use } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusPill, EmptyState, TableSkeleton } from "@/components/app/Ui";
import { EmployeeCheckInModal } from "@/components/app/EmployeeCheckInModal";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { getBusinessCategoryConfig } from "@/lib/service-ia/business-categories";
import { useI18n } from "@/lib/i18n";
import {
  UserCheck,
  QrCode,
  Clock,
  MapPin,
  ShieldCheck,
  LogOut,
  ExternalLink,
  Users,
  Download,
  CheckCircle2,
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
  const { t, lang } = useI18n();
  const searchParams = useSearchParams();
  const [data, setData] = useState<AttendanceTodaySummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [checkInOpen, setCheckInOpen] = useState<boolean>(false);
  const [initialToken, setInitialToken] = useState<string>("");
  const [businessCategory, setBusinessCategory] = useState<string>("retail");

  // Auto open check-in modal if scanned from smartphone camera with ?scan=TOKEN
  useEffect(() => {
    const scanParam = searchParams.get("scan") || searchParams.get("token");
    if (scanParam) {
      setInitialToken(scanParam);
      setCheckInOpen(true);
    }
  }, [searchParams]);

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

  const proConfig = getBusinessCategoryConfig(businessCategory, lang);

  const formatTimeStr = (iso?: string | null) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return iso;
    }
  };

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          eyebrow={proConfig.registers.attendance.title}
          title={t("attendance_title")}
          description={t("attendance_desc")}
          action={
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href="/espace/presence/borne"
                target="_blank"
                className="app-button app-button-secondary inline-flex items-center gap-2"
                title={t("attendance_btn_kiosk")}
              >
                <QrCode size={16} className="text-teal-600 dark:text-teal-400" />
                <span>{t("attendance_btn_kiosk")}</span>
                <ExternalLink size={13} className="opacity-60" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  setInitialToken("");
                  setCheckInOpen(true);
                }}
                className="app-button app-button-primary inline-flex items-center gap-2"
              >
                <UserCheck size={16} />
                <span>{t("attendance_btn_checkin")}</span>
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
                {t("attendance_kpi_present")}
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
                {t("attendance_kpi_late")}
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

        {/* Live Attendance Table */}
        <section className="app-panel">
          <div className="app-panel-head">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-primary" />
              <h2>Pointages & Émargements du Jour</h2>
            </div>
            <StatusPill>{(data?.records || []).length} collaborateurs</StatusPill>
          </div>

          {loading && <TableSkeleton />}
          {error && <EmptyState title={t("common_error")} detail={error} onRetry={loadData} />}

          {!loading && !error && (!data?.records || data.records.length === 0) && (
            <EmptyState
              title="Aucun pointage aujourd'hui"
              detail="Lancez la borne de pointage en magasin ou invitez vos collaborateurs à scanner leur QR Code."
              onRetry={loadData}
            />
          )}

          {data?.records && data.records.length > 0 && (
            <div className="overflow-x-auto">
              <table className="app-table w-full text-left text-xs">
                <thead>
                  <tr>
                    <th>{t("attendance_th_member")}</th>
                    <th>{t("attendance_th_checkin")}</th>
                    <th>{t("attendance_th_checkout")}</th>
                    <th>{t("attendance_th_status")}</th>
                    <th>CONTRÔLE SÉCURITÉ</th>
                  </tr>
                </thead>
                <tbody>
                  {data.records.map((r) => (
                    <tr key={r.id} className="border-b border-border/60 hover:bg-muted/30 transition">
                      <td className="py-3 px-4 font-bold text-foreground">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            {r.employee_name ? r.employee_name[0].toUpperCase() : "E"}
                          </div>
                          <span>{r.employee_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-foreground">
                        {formatTimeStr(r.check_in_time)}
                      </td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">
                        {formatTimeStr(r.check_out_time)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            r.status === "present"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : r.status === "late"
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                              : "bg-destructive/15 text-destructive"
                          }`}
                        >
                          {r.status === "present"
                            ? t("attendance_badge_present")
                            : r.status === "late"
                            ? t("attendance_badge_late")
                            : t("attendance_badge_absent")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <ShieldCheck size={14} className="text-teal-500" />
                          <span>Borne TOTP</span>
                          {r.check_in_lat && (
                            <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                              <MapPin size={11} /> GPS
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Check-In Modal */}
      <EmployeeCheckInModal
        open={checkInOpen}
        onClose={() => setCheckInOpen(false)}
        onSuccess={loadData}
        defaultToken={initialToken}
      />
    </>
  );
}
