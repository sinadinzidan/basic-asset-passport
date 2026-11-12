import { describe, expect, it } from 'vitest';

import { CriticalityTone } from '../../enums/criticalityTone';
import { getCriticalityTone } from '../assetCriticality';

describe(getCriticalityTone.name, () => {
  it.each([
    ['A - High criticality', CriticalityTone.ERROR],
    ['B - Medium criticality', CriticalityTone.WARNING],
    ['C - Low criticality', CriticalityTone.SUCCESS],
  ] as const)('maps "%s" to the %s tone', (criticality, tone) => {
    expect(getCriticalityTone(criticality)).toBe(tone);
  });

  it('reads the class letter case-insensitively and ignores leading spaces', () => {
    expect(getCriticalityTone('  a - high')).toBe(CriticalityTone.ERROR);
  });

  it('reads a bare class letter', () => {
    expect(getCriticalityTone('B')).toBe(CriticalityTone.WARNING);
  });

  it.each(['Unknown', 'ABC', 'D - Other', ''])('uses the neutral tone for "%s"', (criticality) => {
    expect(getCriticalityTone(criticality)).toBe(CriticalityTone.NEUTRAL);
  });
});
