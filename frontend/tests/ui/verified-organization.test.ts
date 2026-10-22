import { describe, expect, it, vi } from 'vitest';
import { CommandDataError } from '@/components/grand-siege/fresh-command-data';
import { fetchVerifiedOrganization, isTransientOrganizationFailure } from '@/components/grand-siege/verified-organization';

describe('CAURI: récupération sécurisée de l’identité d’entreprise', () => {
  it('reprend après deux échecs réseau temporaires et vérifie à nouveau côté serveur', async () => {
    const fetchIdentity = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({ id: 'tenant-a' });
    const result = await fetchVerifiedOrganization(new AbortController().signal, fetchIdentity, [0, 0]);
    expect(result).toEqual({ id: 'tenant-a' });
    expect(fetchIdentity).toHaveBeenCalledTimes(3);
  });

  it('réessaie une passerelle indisponible (502) avant de conclure à une panne', async () => {
    const fetchIdentity = vi.fn().mockRejectedValueOnce(new CommandDataError(502)).mockResolvedValueOnce({ id: 'tenant-b' });
    await expect(fetchVerifiedOrganization(new AbortController().signal, fetchIdentity, [0])).resolves.toEqual({ id: 'tenant-b' });
    expect(fetchIdentity).toHaveBeenCalledTimes(2);
  });

  it.each([401, 403, 404])('ne contourne pas un refus ou une organisation absente (HTTP %s)', async (status) => {
    const fetchIdentity = vi.fn().mockRejectedValue(new CommandDataError(status));
    await expect(fetchVerifiedOrganization(new AbortController().signal, fetchIdentity, [0, 0])).rejects.toMatchObject({ status });
    expect(fetchIdentity).toHaveBeenCalledTimes(1);
  });

  it('abandonne dès que le composant interrompt la requête', async () => {
    const controller = new AbortController();
    const fetchIdentity = vi.fn().mockImplementation(async () => {
      controller.abort();
      throw new TypeError('Failed to fetch');
    });
    await expect(fetchVerifiedOrganization(controller.signal, fetchIdentity, [0, 0])).rejects.toBeInstanceOf(TypeError);
    expect(fetchIdentity).toHaveBeenCalledTimes(1);
  });

  it('ne confond pas les erreurs applicatives avec une panne réseau', () => {
    expect(isTransientOrganizationFailure(new Error('Invalid organization'))).toBe(false);
    expect(isTransientOrganizationFailure(new CommandDataError(403))).toBe(false);
    expect(isTransientOrganizationFailure(new TypeError('Failed to fetch'))).toBe(true);
  });
});
