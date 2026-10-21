import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PageHeader } from '@/components/app/PageHeader';
import { EmptyState } from '@/components/app/Ui';

afterEach(cleanup);

describe('CAURI — presentation editorial commune', () => {
  it('préserve le titre, la description et l’action des écrans métier', () => {
    const action = vi.fn();
    render(<PageHeader eyebrow="GESTION" title="Documents" description="Consultez vos justificatifs." action={<button onClick={action}>Ajouter</button>} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Documents' })).toBeTruthy();
    expect(screen.getByText('Consultez vos justificatifs.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));
    expect(action).toHaveBeenCalledTimes(1);
  });
  it('préserve le message métier précis, sans masquer la possibilité de réessayer', () => {
    const retry = vi.fn();
    render(<EmptyState title="Aucun document" detail="Sélectionnez une référence pour afficher les justificatifs." onRetry={retry} />);
    expect(screen.getByRole('heading', { name: 'Aucun document' })).toBeTruthy();
    expect(screen.getByText(/Sélectionnez une référence/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
  it('ne promet pas la synchronisation d’opérations quand le réseau est coupé', () => {
    render(<EmptyState title="Service indisponible" detail="Failed to fetch" />);
    expect(screen.getByText(/ne sont pas confirmées comme synchronisées/)).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Connexion au service indisponible' })).toBeTruthy();
  });
});
