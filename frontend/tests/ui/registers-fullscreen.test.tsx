import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { I18nProvider } from '@/lib/i18n';
import { SalesTableInteractive } from '@/components/app/RegistersTable';

afterEach(() => { cleanup(); document.body.classList.remove('kx-fullpage-mode'); });

describe('CAURI Commerce — mode plein écran', () => {
  it('monte le registre au niveau du document, hors de la navigation du département', () => {
    const { container, rerender } = render(
      <I18nProvider><SalesTableInteractive sales={[]} isFullscreen={false} onSelect={vi.fn()} onEdit={vi.fn()} onArchive={vi.fn()} onRefresh={vi.fn()} /></I18nProvider>,
    );
    expect(container.querySelector('.kx-table-wrapper')).toBeTruthy();
    rerender(
      <I18nProvider><SalesTableInteractive sales={[]} isFullscreen={true} onToggleFullscreen={vi.fn()} onSelect={vi.fn()} onEdit={vi.fn()} onArchive={vi.fn()} onRefresh={vi.fn()} /></I18nProvider>,
    );
    expect(container.querySelector('.cauri-sales-fullscreen')).toBeNull();
    expect(document.body.querySelector(':scope > .cauri-sales-fullscreen')).toBeTruthy();
    expect(document.body.classList.contains('kx-fullpage-mode')).toBe(true);
    expect(screen.getByRole('button', { name: /quitter.*plein.*cran/i })).toBeTruthy();
  });
});
