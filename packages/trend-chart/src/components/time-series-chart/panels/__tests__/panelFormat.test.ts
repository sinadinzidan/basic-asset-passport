import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { setChartTimeZone } from '../../../../lib/timeZone';
import { formatChartInstant, formatChartInstantShort, formatCountOf } from '../panelFormat';

const INSTANT = Date.UTC(2026, 9, 1, 8, 5);

// The host app may have set its own zone; these tests start from the chart's default.
beforeEach(() => setChartTimeZone({ id: 'UTC', label: 'UTC' }));
afterEach(() => setChartTimeZone({ id: 'UTC', label: 'UTC' }));

describe(formatChartInstant.name, () => {
  it('writes the date, the time and the zone of an instant', () => {
    expect(formatChartInstant(INSTANT)).toBe('01-Oct-2026 08:05 UTC');
  });

  it('writes the instant on the clock of the chart zone', () => {
    setChartTimeZone({ id: 'Asia/Dubai', label: 'GST' });

    expect(formatChartInstant(INSTANT)).toBe('01-Oct-2026 12:05 GST');
  });
});

describe(formatChartInstantShort.name, () => {
  it('leaves out the year and the zone', () => {
    expect(formatChartInstantShort(INSTANT)).toBe('1 Oct, 08:05');
  });
});

describe(formatCountOf.name, () => {
  it('names one thing in the singular', () => {
    expect(formatCountOf(1, 'reading')).toBe('1 reading');
  });

  it('names none and several in the plural', () => {
    expect(formatCountOf(0, 'reading')).toBe('0 readings');
    expect(formatCountOf(2, 'reading')).toBe('2 readings');
  });

  it('separates the thousands', () => {
    expect(formatCountOf(1234, 'reading')).toBe('1,234 readings');
  });

  it('takes the plural it is given', () => {
    expect(formatCountOf(2, 'series', 'series')).toBe('2 series');
  });
});
