import { describe, expect, it } from 'vitest';
import { CAURI_AI_OPEN_EVENT, createIntelligenceRequest, INTELLIGENCE_PROMPTS } from '@/components/grand-siege/intelligence-context';
import { DEPARTMENTS } from '@/components/grand-siege/departments';

describe('CAURI — assistance contextuelle du Grand Siège', () => {
  it('offre une question préparée pour chaque département', () => {
    for (const department of DEPARTMENTS) {
      const request = createIntelligenceRequest(department.id);
      expect(request.prompt.length).toBeGreaterThan(35);
      expect(request.prompt).toBe(INTELLIGENCE_PROMPTS[department.id]);
    }
  });
  it('propose une synthèse pour le Grand Hall sans envoyer de données personnelles', () => {
    expect(createIntelligenceRequest('hall').prompt).toContain('situation de mon entreprise');
    expect(Object.keys(createIntelligenceRequest('hall'))).toEqual(['prompt']);
    expect(CAURI_AI_OPEN_EVENT).toBe('cauri:open-intelligence');
  });
});
