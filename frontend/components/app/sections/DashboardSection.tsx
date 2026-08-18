"use client";

import React, { useState } from "react";
import { ExecutiveDashboard } from "../ExecutiveDashboard";
import { RegisterCreateDialog } from "../RegisterCreateDialog";
import { DashboardSkeleton, EmptyState } from "../Ui";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { SaleItem } from "../RegistersTable";

export type DashboardSummary = {
  total_sales_count: number;
  total_sales_amount: number | string;
  total_paid_amount: number | string;
  total_unpaid_amount: number | string;
  total_partial_amount: number | string;
  offers_count: number;
  procedures_count: number;
  primary_currency: string;
  recent_sales: SaleItem[];
};

export type DashboardAlert = {
  id: string;
  title: string;
  explanation: string;
  priority: string;
  dimension: string;
  status: string;
  confidence: number;
};

export type DashboardAction = {
  id: string;
  title: string;
  status: string;
  priority: string;
  responsible_user_id?: string | null;
  due_date?: string | null;
};

export function DashboardSection({
  summary,
  alerts,
  actions,
  organizationName,
  loading,
  error,
  onReload,
}: {
  summary: DashboardSummary | null;
  alerts: DashboardAlert[];
  actions: DashboardAction[];
  organizationName: string;
  loading: boolean;
  error: string;
  onReload: () => Promise<void>;
}) {
  const [radarRunning, setRadarRunning] = useState(false);
  const [creatingKind, setCreatingKind] = useState<"offers" | "sales" | "procedures" | null>(null);

  const triggerRadar = async () => {
    setRadarRunning(true);
    try {
      await serviceIaFetch("/radar/runs", { method: "POST" });
      await onReload();
    } finally {
      setRadarRunning(false);
    }
  };

  const resolveAlert = async (id: string) => {
    await serviceIaFetch(`/radar/alerts/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "resolved" }),
    });
    await onReload();
  };

  const createActionFromAlert = async (alert: DashboardAlert) => {
    await serviceIaFetch("/workflow/actions", {
      method: "POST",
      body: JSON.stringify({
        alert_id: alert.id,
        title: alert.title,
        description: alert.explanation,
        priority: alert.priority,
      }),
    });
    await serviceIaFetch(`/radar/alerts/${alert.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "acknowledged" }),
    });
    await onReload();
  };

  return (
    <>
      {loading && <DashboardSkeleton />}
      {error && <EmptyState title="Données indisponibles" detail={error} />}

      {!loading && !error && (
        <ExecutiveDashboard
          summary={summary}
          alerts={alerts}
          actions={actions}
          organizationName={organizationName}
          onOpenCreate={(kind) => setCreatingKind(kind)}
          onTriggerRadar={triggerRadar}
          radarRunning={radarRunning}
          onResolveAlert={resolveAlert}
          onCreateActionFromAlert={createActionFromAlert}
        />
      )}

      {creatingKind && (
        <RegisterCreateDialog
          kind={creatingKind}
          open={Boolean(creatingKind)}
          onClose={() => setCreatingKind(null)}
          onCreated={() => {
            setCreatingKind(null);
            void onReload();
          }}
        />
      )}
    </>
  );
}
