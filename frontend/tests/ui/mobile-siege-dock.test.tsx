import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MobileSiegeDock } from '@/components/grand-siege/MobileSiegeDock';
import { CAURI_AI_OPEN_EVENT } from '@/components/grand-siege/intelligence-context';

let permitted = new Set(['direction', 'radar']);
vi.mock('@/components/grand-siege/useDepartmentCatalogue', () => ({
  useDepartmentCatalogue: () => ({ lookup: (id: string) => permitted.has(id) ? { id } : undefined }),
}));

afterEach(() => { cleanup(); permitted = new Set(['direction', 'radar']); });

describe('CAURI — dock mobile du Grand Siège', () => {
  it('propose le Grand Hall et les sections mobiles sans liens métier non autorisés', () => {
    render(<MobileSiegeDock pathname="/espace" organizationId="tenant-1" />);
    expect(screen.getByRole('navigation', { name: 'Navigation mobile du Grand Siège' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Grand Hall' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Départements' }).getAttribute('href')).toBe('/espace#departements');
    expect(screen.getByRole('link', { name: 'Pilotage' }).getAttribute('href')).toBe('#centre-commandement');
  });
  it('ne rend pas le pilotage cliquable si les permissions ne sont pas vérifiées', () => {
    permitted = new Set();
    render(<MobileSiegeDock pathname="/espace/finance" organizationId={null} />);
    expect(screen.queryByRole('link', { name: 'Pilotage' })).toBeNull();
    expect(screen.getByRole('button', { name: 'CAURI IA' }).hasAttribute('disabled')).toBe(true);
  });
  it('prépare la question IA du département sans effectuer d’envoi automatique', () => {
    const listener = vi.fn();
    window.addEventListener(CAURI_AI_OPEN_EVENT, listener);
    render(<MobileSiegeDock pathname="/espace/finance" organizationId="tenant-1" />);
    fireEvent.click(screen.getByRole('button', { name: 'CAURI IA' }));
    expect(listener).toHaveBeenCalledTimes(1);
    const event = listener.mock.calls[0][0] as CustomEvent<{ prompt: string }>;
    expect(event.detail.prompt).toContain('situation financière');
    window.removeEventListener(CAURI_AI_OPEN_EVENT, listener);
  });
});
