import type { DepartmentKey } from './departments';

export type BackendDepartment = {
  id: string;
  label: string;
  path: string;
  allowed: boolean;
  available: boolean;
  access_status: string;
  availability_scope?: string;
  required_permission?: string;
};
export type DepartmentCatalogue = { schema_version: string; organization_id: string; departments: BackendDepartment[] };

export const OFFICIAL_IDS: readonly DepartmentKey[] = ['direction', 'commerce', 'finances', 'operations', 'organisation', 'radar'];

/** Fail closed: no navigable tiles if the catalogue is missing or belongs to another tenant. */
export function authorizedDepartments(catalogue: DepartmentCatalogue | null, organizationId: string | null): Map<DepartmentKey, BackendDepartment> {
  const result = new Map<DepartmentKey, BackendDepartment>();
  if (!catalogue || !organizationId || catalogue.schema_version !== '1.0' || catalogue.organization_id !== organizationId) return result;
  for (const item of catalogue.departments) {
    if (OFFICIAL_IDS.includes(item.id as DepartmentKey) && !result.has(item.id as DepartmentKey) && item.allowed === true && item.available === true && item.access_status === 'autorise') {
      result.set(item.id as DepartmentKey, item);
    }
  }
  return result;
}
