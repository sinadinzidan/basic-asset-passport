import { MISSING_VALUE, formatNumber } from '../format';

const LARGE_VALUE = 1000;
const MEDIUM_VALUE = 10;
const MEDIUM_FRACTION_DIGITS = 1;
const SMALL_FRACTION_DIGITS = 2;

/** A signal value with the precision its size deserves; missing values read "---", never zero (CE-09). */
export function formatSignalValue(value: number | undefined | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return MISSING_VALUE;
  const magnitude = Math.abs(value);
  if (magnitude >= LARGE_VALUE) return formatNumber(value, 0);
  if (magnitude >= MEDIUM_VALUE) return formatNumber(value, MEDIUM_FRACTION_DIGITS);
  return formatNumber(value, SMALL_FRACTION_DIGITS);
}

export function formatSignalWithUnit(value: number | undefined | null, unit: string): string {
  const text = formatSignalValue(value);
  return text === MISSING_VALUE || unit.length === 0 ? text : `${text} ${unit}`;
}
