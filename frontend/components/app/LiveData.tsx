"use client";

import { useCallback, useEffect, useState } from "react";
import { serviceIaFetch, getPersistedCache } from "@/lib/service-ia/api";

import {
  RegistersSection,
  OfferItem,
  ProcedureItem,
} from "./sections/RegistersSection";
import {
  DashboardSection,
  DashboardSummary,
  DashboardAlert,
  DashboardAction,
} from "./sections/DashboardSection";
import { ActionsSection, ActionItem } from "./sections/ActionsSection";
import { RadarSection, AlertItem } from "./sections/RadarSection";
import { ValidationsSection, ValidationItem } from "./sections/ValidationsSection";
import {
  OrganizationSection,
  OrgData,
  OrgMember,
  OrgInvitation,
} from "./sections/OrganizationSection";
import { DocumentsSection } from "./sections/DocumentsSection";
import { SettingsSection, RadarRule } from "./sections/SettingsSection";
import { ImportsSection } from "./sections/ImportsSection";
import { SaleItem } from "./RegistersTable";
import { CashflowSummaryData } from "@/lib/radar/cashflow-projection";
import { RawAuditEvent } from "@/lib/audit/audit-hash-chain";

// Common API page structure
export type ApiPage<T> = { items: T[]; total: number; page: number; page_size: number };

// Generic Data Fetcher Hook with instant cache hydration
export function useApi<T>(path: string) {
  const [data, setData] = useState<T | null>(() => getPersistedCache<T>(path));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(() => !getPersistedCache<T>(path));

  const reload = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError("");
      try {
        const fresh = await serviceIaFetch<T>(path);
        setData(fresh);
      } catch (e) {
        if (!data) {
          setError(e instanceof Error ? e.message : "API indisponible");
        }
      } finally {
        setLoading(false);
      }
    },
    [path, data]
  );

  useEffect(() => {
    const hasCached = !!getPersistedCache<T>(path);
    void reload(hasCached);
  }, [path]);

  return { data, error, loading, reload: () => reload(false) };
}

// 1. LiveRegister Component (Offers, Sales, Procedures)
export function LiveRegister({ kind }: { kind: "offers" | "sales" | "procedures" }) {
  const api = useApi<ApiPage<OfferItem | SaleItem | ProcedureItem>>(`/registers/${kind}`);
  return (
    <RegistersSection
      kind={kind}
      items={api.data?.items ?? []}
      loading={api.loading}
      error={api.error}
      onReload={api.reload}
    />
  );
}

// 2. LiveDashboard Component
export function LiveDashboard() {
  const dashboard = useApi<{
    summary: DashboardSummary;
    alerts: DashboardAlert[];
    actions: DashboardAction[];
    organization: OrgData;
  }>("/dashboard");

  return (
    <DashboardSection
      summary={dashboard.data?.summary ?? null}
      alerts={dashboard.data?.alerts ?? []}
      actions={dashboard.data?.actions ?? []}
      organizationName={dashboard.data?.organization.name ?? "Organisation KORYXA"}
      organizationBusinessCategory={dashboard.data?.organization.business_category}
      loading={dashboard.loading}
      error={dashboard.error}
      onReload={dashboard.reload}
    />
  );
}

// 3. LiveActions Component
export function LiveActions() {
  const q = useApi<ActionItem[]>("/workflow/actions");
  return (
    <ActionsSection
      data={q.data}
      loading={q.loading}
      error={q.error}
      onReload={q.reload}
    />
  );
}

// 4. LiveRadar Component - Cockpit Prédictif & Alertes
export function LiveRadar() {
  const alertsApi = useApi<AlertItem[]>("/radar/alerts");
  const cashflowApi = useApi<CashflowSummaryData>("/registers/cashflow-summary");
  const salesApi = useApi<ApiPage<SaleItem>>("/registers/sales?payment_status=unpaid&page_size=50");
  const orgApi = useApi<OrgData>("/organizations/current");

  const reloadAll = async () => {
    await Promise.all([alertsApi.reload(), cashflowApi.reload(), salesApi.reload()]);
  };

  return (
    <RadarSection
      data={alertsApi.data}
      loading={alertsApi.loading || cashflowApi.loading}
      error={alertsApi.error || cashflowApi.error}
      onReload={reloadAll}
      cashflowData={cashflowApi.data}
      unpaidSales={salesApi.data?.items ?? []}
      organizationName={orgApi.data?.name}
    />
  );
}

// 5. LiveValidations Component - Double Contrôle & Registre Immuable
export function LiveValidations() {
  const validationsApi = useApi<ValidationItem[]>("/workflow/validations?status=pending");
  const auditApi = useApi<RawAuditEvent[]>("/workflow/audit");

  const reloadAll = async () => {
    await Promise.all([validationsApi.reload(), auditApi.reload()]);
  };

  return (
    <ValidationsSection
      data={validationsApi.data}
      loading={validationsApi.loading || auditApi.loading}
      error={validationsApi.error || auditApi.error}
      onReload={reloadAll}
      auditEvents={auditApi.data ?? []}
    />
  );
}

// 6. LiveOrganization Component
export function LiveOrganization() {
  const org = useApi<OrgData>("/organizations/current");
  const members = useApi<OrgMember[]>("/members");
  const invitations = useApi<OrgInvitation[]>("/invitations");

  const reloadAll = async () => {
    await Promise.all([org.reload(), members.reload(), invitations.reload()]);
  };

  return (
    <OrganizationSection
      org={org.data}
      members={members.data}
      invitations={invitations.data}
      loading={org.loading || members.loading}
      error={org.error || members.error}
      onReload={reloadAll}
    />
  );
}

// 7. LiveDocuments Component
export function LiveDocuments() {
  return <DocumentsSection />;
}

// 8. LiveSettings Component
export function LiveSettings() {
  const q = useApi<RadarRule[]>("/radar/rules");
  return (
    <SettingsSection
      rules={q.data}
      loading={q.loading}
      error={q.error}
      onReload={q.reload}
    />
  );
}

// 9. LiveImports Component
export function LiveImports() {
  return <ImportsSection />;
}
