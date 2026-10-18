import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { IntelligenceEntry } from '@/components/grand-siege/IntelligenceEntry';
import { CAURI_AI_OPEN_EVENT, INTELLIGENCE_PROMPTS } from '@/components/grand-siege/intelligence-context';

afterEach(cleanup);

describe('CAURI Premium — intelligence contextuelle', () => {
  it('propose trois questions éditables depuis le Grand Hall, sans envoi réseau', () => {
    const receiver = vi.fn();
    window.addEventListener(CAURI_AI_OPEN_EVENT, receiver);
    render(<IntelligenceEntry context="hall" />);
    expect(screen.getByRole('region', { name: 'Intelligence CAURI' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Examiner les priorités/i }));
    expect(receiver).toHaveBeenCalledTimes(1);
    const event = receiver.mock.calls[0][0] as CustomEvent<{ prompt: string }>;
    expect(event.detail.prompt).toContain('dossiers et actions');
    window.removeEventListener(CAURI_AI_OPEN_EVENT, receiver);
  });

  it('conserve la question métier du département sans trois raccourcis supplémentaires', () => {
    const receiver = vi.fn();
    window.addEventListener(CAURI_AI_OPEN_EVENT, receiver);
    render(<IntelligenceEntry context="finances" compact />);
    expect(screen.queryByRole('button', { name: /Examiner les priorités/i })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Interroger CAURI/i }));
    const event = receiver.mock.calls[0][0] as CustomEvent<{ prompt: string }>;
    expect(event.detail.prompt).toBe(INTELLIGENCE_PROMPTS.finances);
    window.removeEventListener(CAURI_AI_OPEN_EVENT, receiver);
  });
});
