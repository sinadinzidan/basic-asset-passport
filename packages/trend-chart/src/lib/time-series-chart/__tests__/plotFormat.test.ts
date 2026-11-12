import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { setChartTimeZone } from '../../timeZone';
import { formatPlotTimestamp } from '../plotFormat';

// The host app may have set its own zone; these tests start from the chart's default.
beforeEach(() => setChartTimeZone({ id: 'UTC', label: 'UTC' }));
afterEach(() => setChartTimeZone({ id: 'UTC', label: 'UTC' }));

describe(formatPlotTimestamp.name, () => {
  it('gives the date, the time to the second and the zone', () => {
    expect(formatPlotTimestamp(Date.UTC(2026, 9, 1, 8, 5, 42))).toBe('01-Oct-2026 08:05:42 UTC');
  });

  it('counts the hours to 23, never with am and pm', () => {
    expect(formatPlotTimestamp(Date.UTC(2026, 9, 1, 23, 59, 59))).toBe('01-Oct-2026 23:59:59 UTC');
  });

  it('shows the instant on the wall clock of the chart zone, date included', () => {
    setChartTimeZone({ id: 'Asia/Dubai', label: 'GST' });

    expect(formatPlotTimestamp(Date.UTC(2026, 9, 1, 22, 0, 0))).toBe('02-Oct-2026 02:00:00 GST');
  });
});
