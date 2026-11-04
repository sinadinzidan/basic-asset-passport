import { describe, expect, it } from 'vitest';

import { getCriticalityTone } from '../assetCriticality';

describe(getCriticalityTone.name, () => {
  it.each([
    ['A - High criticality', 'error'],
    ['B - Medium criticality', 'warning'],
    ['C - Low criticality', 'info'],
  ] as const)('maps "%s" to the %s tone', (criticality, tone) => {
    expect(getCriticalityTone(criticality)).toBe(tone);
  });

  it('reads the class letter case-insensitively and ignores leading spaces', () => {
    expect(getCriticalityTone('  a - high')).toBe('error');
  });

  it('reads a bare class letter', () => {
    expect(getCriticalityTone('B')).toBe('warning');
  });

  it.each(['Unknown', 'ABC', 'D - Other', ''])(
    'uses the neutral tone for "%s"',
    (criticality) => {
      expect(getCriticalityTone(criticality)).toBe('neutral');
    },
  );
});
