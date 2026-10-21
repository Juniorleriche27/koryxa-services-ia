import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { OrganizationGate } from '@/components/grand-siege/OrganizationGate';

afterEach(cleanup);

describe('CAURI Grand Siège — vérification de l’organisation', () => {
  it('affiche une attente accessible sans divulguer de données métier', () => {
    render(<OrganizationGate loading onRetry={vi.fn()} />);
    const status = screen.getByRole('status', { name: 'Accès au siège CAURI' });
    expect(status.getAttribute('aria-busy')).toBe('true');
    expect(screen.getByRole('heading', { name: 'Préparation de votre espace' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Réessayer/ })).toBeNull();
    expect(screen.getByText(/Aucun contenu d’entreprise/)).toBeTruthy();
  });

  it('permet une nouvelle vérification après indisponibilité sans afficher de données', () => {
    const retry = vi.fn();
    render(<OrganizationGate loading={false} onRetry={retry} />);
    expect(screen.getByRole('status').getAttribute('aria-busy')).toBe('false');
    expect(screen.getByRole('heading', { name: 'Accès à votre entreprise indisponible' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Réessayer/ }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
