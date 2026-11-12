import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildExportFileName } from '../csv';
import { setChartTimeZone } from '../timeZone';

// The host app may have set its own zone; these tests start from the chart's default.
beforeEach(() => setChartTimeZone({ id: 'UTC', label: 'UTC' }));
afterEach(() => setChartTimeZone({ id: 'UTC', label: 'UTC' }));

describe('buildExportFileName', () => {
  it('names the module, the scope and the minute, with lower-case words joined by hyphens', () => {
    const name = buildExportFileName(
      'Time series',
      'Pump P-101A',
      new Date(Date.UTC(2026, 9, 1, 8, 5)),
    );

    expect(name).toBe('time-series_pump-p-101a_20261001-0805.csv');
  });

  it('takes the minute on the clock of the chart zone', () => {
    setChartTimeZone({ id: 'Asia/Dubai', label: 'GST' });

    expect(buildExportFileName('Time series', 'Pump', new Date(Date.UTC(2026, 9, 1, 22, 5)))).toBe(
      'time-series_pump_20261002-0205.csv',
    );
  });
});
