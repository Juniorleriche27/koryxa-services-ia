"use client";

import { useCallback, useEffect, useState } from "react";
import { serviceIaFetch } from "@/lib/service-ia/api";

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

// Common API page structure
export type ApiPage<T> = { items: T[]; total: number; page: number; page_size: number };

// Generic Data Fetcher Hook
export function useApi<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await serviceIaFetch<T>(path));
    } catch (e) {
      setError(e instanceof Error ? e.message : "API indisponible");
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, error, loading, reload };
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

// 4. LiveRadar Component
export function LiveRadar() {
  const q = useApi<AlertItem[]>("/radar/alerts");
  return (
    <RadarSection
      data={q.data}
      loading={q.loading}
      error={q.error}
      onReload={q.reload}
    />
  );
}

// 5. LiveValidations Component
export function LiveValidations() {
  const q = useApi<ValidationItem[]>("/workflow/validations?status=pending");
  return (
    <ValidationsSection
      data={q.data}
      loading={q.loading}
      error={q.error}
      onReload={q.reload}
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
