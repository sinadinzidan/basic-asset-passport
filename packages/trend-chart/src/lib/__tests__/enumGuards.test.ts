import { describe, expect, it } from 'vitest';

import { ChartMode } from '../../enums/monitoring';
import { isEnumValue } from '../enumGuards';

describe(isEnumValue.name, () => {
  it('accepts a value of the enum', () => {
    expect(isEnumValue(ChartMode, 'STACKED')).toBe(true);
  });

  it('refuses a text that is not a value of the enum', () => {
    expect(isEnumValue(ChartMode, 'stacked')).toBe(false);
  });

  it('refuses anything that is not a text', () => {
    expect(isEnumValue(ChartMode, undefined)).toBe(false);
    expect(isEnumValue(ChartMode, 1)).toBe(false);
    expect(isEnumValue(ChartMode, null)).toBe(false);
  });
});
