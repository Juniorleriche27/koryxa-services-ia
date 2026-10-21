import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { GrandHallTopbar } from '@/components/grand-siege/GrandHallTopbar';

vi.mock('@clerk/nextjs', () => ({ UserButton: () => <span aria-label="Compte" /> }));
vi.mock('@/components/app/LanguageSelector', () => ({ LanguageSelector: () => <span>FR</span> }));

afterEach(cleanup);

function createCallbacks() {
  return { searchLabel: 'Recherche & actions', vocalLabel: 'Vocal', onSearch: vi.fn(), onVoice: vi.fn(), onHelp: vi.fn(), onContact: vi.fn() };
}

describe('CAURI — Grand Hall premium topbar', () => {
  it('retains actual search and voice commands with clear accessible labels', () => {
    const callbacks = createCallbacks();
    render(<GrandHallTopbar {...callbacks} />);
    expect(screen.getByRole('link', { name: 'CAURI — Grand Siège, accueil' }).getAttribute('href')).toBe('/espace');
    fireEvent.click(screen.getByRole('button', { name: callbacks.searchLabel }));
    fireEvent.click(screen.getByRole('button', { name: callbacks.vocalLabel }));
    expect(callbacks.onSearch).toHaveBeenCalledTimes(1);
    expect(callbacks.onVoice).toHaveBeenCalledTimes(1);
  });

  it('groups guide, contact and public website without losing their behavior', () => {
    const callbacks = createCallbacks();
    render(<GrandHallTopbar {...callbacks} />);
    fireEvent.click(screen.getByText('Guide et visite'));
    fireEvent.click(screen.getByText('Nous contacter'));
    expect(callbacks.onHelp).toHaveBeenCalledTimes(1);
    expect(callbacks.onContact).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: /Site public/ }).getAttribute('href')).toBe('https://service-ia.koryxa.fr');
  });
});
