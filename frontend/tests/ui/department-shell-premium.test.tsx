import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { DepartmentShell } from '@/components/grand-siege/DepartmentShell';

let accessState: 'ready' | 'loading' | 'error' | 'denied' = 'ready';
vi.mock('@/components/grand-siege/useDepartmentCatalogue', () => ({
  useDepartmentCatalogue: () => ({
    lookup: (_id: string) => accessState === 'ready' ? { id: _id } : undefined,
    loading: accessState === 'loading',
    error: accessState === 'error',
  }),
}));
vi.mock('@/components/grand-siege/IntelligenceEntry', () => ({
  IntelligenceEntry: () => <div data-testid="intelligence-entry">CAURI IA</div>,
}));

afterEach(() => { cleanup(); accessState = 'ready'; });

describe('CAURI Premium — six institutional departments', () => {
  it('shows an authorized department and its business content', () => {
    render(<DepartmentShell pathname="/espace/finance" organizationId="tenant-one" organizationName="Entreprise" ><div>Contenu financier réservé</div></DepartmentShell>);
    expect(screen.getByRole('heading', { name: 'Finances et trésorerie' })).toBeTruthy();
    expect(screen.getByText('Contenu financier réservé')).toBeTruthy();
    expect(screen.getByTestId('intelligence-entry')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Finances' }).getAttribute('aria-current')).toBe('page');
  });
  it('never mounts business content or AI when permissions are denied', () => {
    accessState = 'denied';
    render(<DepartmentShell pathname="/espace/radar" organizationId="tenant-one"><div>Contenu confidentiel</div></DepartmentShell>);
    expect(screen.getByRole('status').textContent).toContain('Département non accessible');
    expect(screen.queryByText('Contenu confidentiel')).toBeNull();
    expect(screen.queryByTestId('intelligence-entry')).toBeNull();
  });
  it('offers understandable loading and error states without revealing data', () => {
    for (const state of ['loading', 'error'] as const) {
      accessState = state;
      const result = render(<DepartmentShell pathname="/espace/ventes" organizationId="tenant-one"><div>Ventes privées</div></DepartmentShell>);
      expect(screen.queryByText('Ventes privées')).toBeNull();
      expect(screen.getByRole('status').textContent).toContain(state === 'loading' ? 'Vérification des autorisations' : 'Accès momentanément indisponible');
      result.unmount();
    }
  });
});
