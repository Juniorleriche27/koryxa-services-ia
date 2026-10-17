import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { useDepartmentCatalogue } from '@/components/grand-siege/useDepartmentCatalogue';
import type { DepartmentCatalogue } from '@/components/grand-siege/department-contract';

const pending = new Map<string, (value: DepartmentCatalogue) => void>();
vi.mock('@/components/grand-siege/fresh-command-data', () => ({
  fetchFreshCommandData: vi.fn((_path: string, signal: AbortSignal) => new Promise<DepartmentCatalogue>((resolve, reject) => {
    const tenant = String(pending.size + 1);
    pending.set(tenant, resolve);
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
  })),
}));

const makeCatalogue = (organization_id: string): DepartmentCatalogue => ({
  schema_version: '1.0', organization_id,
  departments: [{ id: 'direction', label: 'Direction', path: '/espace', allowed: true, available: true, access_status: 'autorise' }],
});

afterEach(() => { cleanup(); pending.clear(); });

describe('CAURI — accès par organisation et réponses asynchrones', () => {
  it('désactive immédiatement les anciens droits au changement de tenant', async () => {
    const { result, rerender } = renderHook(({ organizationId }) => useDepartmentCatalogue(organizationId), {
      initialProps: { organizationId: 'tenant-a' as string | null },
    });
    expect(result.current.lookup('direction')).toBeUndefined();
    await act(async () => { pending.get('1')?.(makeCatalogue('tenant-a')); });
    await waitFor(() => expect(result.current.lookup('direction')).toBeDefined());

    rerender({ organizationId: 'tenant-b' });
    expect(result.current.lookup('direction')).toBeUndefined();
    await act(async () => { pending.get('2')?.(makeCatalogue('tenant-b')); });
    await waitFor(() => expect(result.current.lookup('direction')).toBeDefined());
  });

  it('rejette un catalogue appartenant à une autre entreprise', async () => {
    const { result } = renderHook(() => useDepartmentCatalogue('tenant-a'));
    await act(async () => { pending.get('1')?.(makeCatalogue('tenant-b')); });
    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.lookup('direction')).toBeUndefined();
  });
});
