import { describe, expect, it } from 'vitest';

import { canConvert, convertibleUnits, convertValue } from '../units';

describe(convertibleUnits.name, () => {
  it('lists the unit first and then the others of its family', () => {
    expect(convertibleUnits('°C')).toEqual(['°C', '°F', 'K']);
    expect(convertibleUnits('K')).toEqual(['K', '°C', '°F']);
  });

  it('keeps gauge and absolute pressure apart', () => {
    expect(convertibleUnits('barg')).toEqual(['barg', 'kPag', 'psig']);
    expect(convertibleUnits('bar')).toEqual(['bar', 'kPa', 'MPa', 'psi']);
  });

  it('offers only the unit itself when it is not a known one', () => {
    expect(convertibleUnits('widgets')).toEqual(['widgets']);
  });
});

describe(canConvert.name, () => {
  it('is true between two units of one family', () => {
    expect(canConvert('bar', 'kPa')).toBe(true);
  });

  it('is true for the same unit, even an unknown one', () => {
    expect(canConvert('widgets', 'widgets')).toBe(true);
  });

  it('is false between gauge and absolute pressure', () => {
    expect(canConvert('barg', 'bar')).toBe(false);
  });

  it('is false between families', () => {
    expect(canConvert('°C', 'bar')).toBe(false);
  });

  it('is false when either unit is unknown or absent', () => {
    expect(canConvert('widgets', 'bar')).toBe(false);
    expect(canConvert('bar', undefined)).toBe(false);
  });
});

describe(convertValue.name, () => {
  it.each([
    [100, '°C', '°F', 212],
    [212, '°F', '°C', 100],
    [0, '°C', 'K', 273.15],
    [32, '°F', 'K', 273.15],
    [1, 'bar', 'kPa', 100],
    [1, 'MPa', 'bar', 10],
    [1, 'psi', 'bar', 0.06894757],
    [1, 'barg', 'kPag', 100],
    [1, 'in/s', 'mm/s', 25.4],
    [1, 'l/s', 'm³/h', 3.6],
    [1, 'm³/s', 'm³/h', 3600],
    [1, 'kg/s', 't/h', 3.6],
    [1, 'A', 'mA', 1000],
    [1, 'Hz', 'rpm', 60],
    [1, 'MW', 'kW', 1000],
    [1, 'hp', 'kW', 0.7457],
  ])('converts %d %s to %s', (value, from, to, expected) => {
    expect(convertValue(value, from, to)).toBeCloseTo(expected, 8);
  });

  it('comes back to the same value when converted there and back', () => {
    const there = convertValue(12.5, 'psi', 'kPa') ?? Number.NaN;

    expect(convertValue(there, 'kPa', 'psi')).toBeCloseTo(12.5, 10);
  });

  it('returns the value as it is for the same unit, even an unknown one', () => {
    expect(convertValue(7, 'widgets', 'widgets')).toBe(7);
  });

  it('refuses to convert between gauge and absolute pressure', () => {
    expect(convertValue(1, 'barg', 'bar')).toBeUndefined();
  });

  it('refuses to convert between families', () => {
    expect(convertValue(1, 'kW', 'A')).toBeUndefined();
  });

  it('refuses an unknown or absent unit rather than guessing', () => {
    expect(convertValue(1, 'widgets', 'bar')).toBeUndefined();
    expect(convertValue(1, undefined, 'bar')).toBeUndefined();
  });
});
