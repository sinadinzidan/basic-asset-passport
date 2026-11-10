import { describe, expect, it } from 'vitest';

import { ChartRange } from '../../../enums/monitoring';
import type { ChartConfiguration } from '../../../types/timeSeriesChart';
import { createChartConfiguration } from '../configuration';
import { chartWindowOf, nowToMinuteMs } from '../window';

describe(nowToMinuteMs.name, () => {
  it('drops the seconds, so a window that ends now keeps one identity for the whole minute', () => {
    expect(nowToMinuteMs('2026-10-01T08:05:42.500Z')).toBe(Date.UTC(2026, 9, 1, 8, 5));
  });
});

describe(chartWindowOf.name, () => {
  it('returns a custom window as two ISO time stamps', () => {
    const start = Date.UTC(2026, 9, 1, 0, 0);
    const end = Date.UTC(2026, 9, 2, 0, 0);
    const configuration: ChartConfiguration = createChartConfiguration(['s1'], {
      range: ChartRange.CUSTOM,
      window: { start, end },
    });

    expect(chartWindowOf(configuration, end + 1000)).toEqual({
      from: '2026-10-01T00:00:00.000Z',
      to: '2026-10-02T00:00:00.000Z',
    });
  });

  it('ends a preset range at now', () => {
    const nowMs = Date.UTC(2026, 9, 2, 12, 0);
    const configuration = createChartConfiguration(['s1'], { range: ChartRange.ONE_HOUR });

    expect(chartWindowOf(configuration, nowMs).to).toBe('2026-10-02T12:00:00.000Z');
  });
});
