import { describe, expect, it } from 'vitest';
import { formatHallMoney, hallMetricDetail } from '@/components/grand-siege/hall-metrics';

describe('CAURI Grand Hall — monetary backend contract', () => {
  it('keeps decimal precision for very large amounts', () => {
    expect(formatHallMoney({ status: 'calculable', value: '9007199254740993.50', currency: 'XOF' })).toContain('9 007 199 254 740 994');
  });
  it('does not disguise incompatible metrics as zero', () => {
    const metric = { status: 'incompatible', value: null, currency: null, reason: 'Devises incompatibles' };
    expect(formatHallMoney(metric)).toBe('—');
    expect(hallMetricDetail(metric)).toBe('Devises incompatibles');
  });
  it('rejects invalid number and currency contracts', () => {
    expect(formatHallMoney({ status: 'calculable', value: 'NaN', currency: 'XOF' })).toBe('—');
    expect(formatHallMoney({ status: 'calculable', value: '120', currency: 'Xof' })).toBe('—');
  });
});
