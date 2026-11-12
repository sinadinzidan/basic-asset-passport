import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  formatDate,
  formatDateTime,
  formatNumber,
  formatShortDateTime,
  MISSING_VALUE,
} from '../format';
import { setChartTimeZone } from '../timeZone';

// The host app may have set its own zone; these tests start from the chart's default.
beforeEach(() => setChartTimeZone({ id: 'UTC', label: 'UTC' }));
afterEach(() => setChartTimeZone({ id: 'UTC', label: 'UTC' }));

describe('formatDateTime', () => {
  it('writes the date and time in the chart zone, followed by its label', () => {
    setChartTimeZone({ id: 'Asia/Dubai', label: 'GST' });

    expect(formatDateTime('2026-10-01T22:30:00Z')).toBe('02-Oct-2026 02:30 GST');
  });

  it('writes UTC by default', () => {
    expect(formatDateTime('2026-10-01T22:30:00Z')).toBe('01-Oct-2026 22:30 UTC');
  });

  it('shows a missing value as a dash', () => {
    expect(formatDateTime(undefined)).toBe(MISSING_VALUE);
    expect(formatDate(undefined)).toBe(MISSING_VALUE);
    expect(formatShortDateTime(undefined)).toBe(MISSING_VALUE);
  });
});

describe('formatShortDateTime', () => {
  it('leaves out the year and the zone label', () => {
    expect(formatShortDateTime('2026-10-01T08:05:00Z')).toBe('1 Oct, 08:05');
  });
});

describe('formatNumber', () => {
  it('groups thousands and fixes the decimals', () => {
    expect(formatNumber(12345.678, 1)).toBe('12,345.7');
  });

  it('shows a missing number as a dash', () => {
    expect(formatNumber(undefined)).toBe(MISSING_VALUE);
    expect(formatNumber(Number.NaN)).toBe(MISSING_VALUE);
  });
});
