import { describe, expect, it } from 'vitest';

import { formatSignalValue, formatSignalWithUnit } from '../signalFormat';

describe(formatSignalValue.name, () => {
  it('reads "---" for a missing value, never zero', () => {
    expect(formatSignalValue(undefined)).toBe('---');
    expect(formatSignalValue(null)).toBe('---');
    expect(formatSignalValue(Number.NaN)).toBe('---');
  });

  it('gives a value from a thousand up without decimals, the thousands separated', () => {
    expect(formatSignalValue(1000)).toBe('1,000');
    expect(formatSignalValue(1234.56)).toBe('1,235');
  });

  it('gives a value from ten up with one decimal', () => {
    expect(formatSignalValue(10)).toBe('10.0');
    expect(formatSignalValue(12.345)).toBe('12.3');
    expect(formatSignalValue(999.94)).toBe('999.9');
  });

  it('gives a value below ten with two decimals', () => {
    expect(formatSignalValue(1.234)).toBe('1.23');
    expect(formatSignalValue(0)).toBe('0.00');
  });

  it('judges a negative value by its size', () => {
    expect(formatSignalValue(-0.5)).toBe('-0.50');
    expect(formatSignalValue(-12.34)).toBe('-12.3');
    expect(formatSignalValue(-1234.56)).toBe('-1,235');
  });
});

describe(formatSignalWithUnit.name, () => {
  it('puts the unit after the value', () => {
    expect(formatSignalWithUnit(12.34, 'bar')).toBe('12.3 bar');
  });

  it('gives no unit to a missing value', () => {
    expect(formatSignalWithUnit(undefined, 'bar')).toBe('---');
    expect(formatSignalWithUnit(null, 'bar')).toBe('---');
  });

  it('gives the value alone when the series has no unit', () => {
    expect(formatSignalWithUnit(12.34, '')).toBe('12.3');
  });
});
