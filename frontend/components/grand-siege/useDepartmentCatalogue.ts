'use client';

import { useEffect, useState } from 'react';
import { fetchFreshCommandData } from './fresh-command-data';
import { authorizedDepartments, type BackendDepartment, type DepartmentCatalogue } from './department-contract';
import type { DepartmentKey } from './departments';

export function useDepartmentCatalogue(organizationId: string | null) {
  const [result, setResult] = useState<{ organizationId: string; data: DepartmentCatalogue | null; error: boolean } | null>(null);
  useEffect(() => {
    if (!organizationId) return;
    const controller = new AbortController();
    fetchFreshCommandData<DepartmentCatalogue>('/departments', controller.signal)
      .then(data => { if (!controller.signal.aborted) setResult({ organizationId, data, error: false }); })
      .catch(() => { if (!controller.signal.aborted) setResult({ organizationId, data: null, error: true }); });
    return () => controller.abort();
  }, [organizationId]);
  const current = result?.organizationId === organizationId ? result : null;
  const permitted = authorizedDepartments(current?.data ?? null, organizationId);
  const lookup = (id: DepartmentKey): BackendDepartment | undefined => permitted.get(id);
  return { permitted, lookup, loading: Boolean(organizationId) && !current, error: !organizationId || Boolean(current?.error) || Boolean(current?.data && current.data.organization_id !== organizationId) };
}
