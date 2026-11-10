import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { chartTimeZone, fromZonedInput, setChartTimeZone, toZonedInput } from '../timeZone';

// The host app may have set its own zone; these tests start from the chart's default.
beforeEach(() => setChartTimeZone({ id: 'UTC', label: 'UTC' }));
afterEach(() => setChartTimeZone({ id: 'UTC', label: 'UTC' }));

describe('the chart time zone', () => {
  it('is UTC until the host sets another', () => {
    expect(chartTimeZone()).toEqual({ id: 'UTC', label: 'UTC' });
    expect(toZonedInput(Date.UTC(2026, 9, 1, 8, 0))).toBe('2026-10-01T08:00');
  });

  it('shows an instant on the wall clock of the zone', () => {
    setChartTimeZone({ id: 'Asia/Dubai', label: 'GST' });

    expect(toZonedInput(Date.UTC(2026, 9, 1, 8, 0))).toBe('2026-10-01T12:00');
  });

  it('reads a wall-clock time of the zone back to the instant', () => {
    setChartTimeZone({ id: 'Asia/Dubai', label: 'GST' });

    expect(fromZonedInput('2026-10-01T12:00')).toBe(Date.UTC(2026, 9, 1, 8, 0));
  });

  it('follows daylight saving: the same wall clock names different instants in summer and winter', () => {
    setChartTimeZone({ id: 'Europe/Oslo', label: 'CET' });

    expect(fromZonedInput('2026-07-01T12:00')).toBe(Date.UTC(2026, 6, 1, 10, 0));
    expect(fromZonedInput('2026-01-01T12:00')).toBe(Date.UTC(2026, 0, 1, 11, 0));
  });

  it('returns undefined for text that is not a time', () => {
    expect(fromZonedInput('')).toBeUndefined();
    expect(fromZonedInput('tomorrow')).toBeUndefined();
  });
});
