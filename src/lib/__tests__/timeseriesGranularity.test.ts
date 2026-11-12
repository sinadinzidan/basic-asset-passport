import { describe, expect, it } from 'vitest';

import { chooseChartGranularity, granularityToMs } from '../timeseriesGranularity';

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

describe(granularityToMs.name, () => {
  it.each([
    ['30s', 30_000],
    ['5m', 300_000],
    ['6h', 6 * HOUR_MS],
    ['2d', 2 * DAY_MS],
  ])('reads %s', (granularity, expected) => {
    expect(granularityToMs(granularity)).toBe(expected);
  });

  it.each(['', 'h', '0m', '5x', '1.5h', 'abc'])('rejects "%s"', (granularity) => {
    expect(granularityToMs(granularity)).toBeNull();
  });
});

describe(chooseChartGranularity.name, () => {
  it('uses the finest step for a short window', () => {
    expect(chooseChartGranularity(HOUR_MS)).toBe('1m');
  });

  it('coarsens as the window grows', () => {
    expect(chooseChartGranularity(DAY_MS)).toBe('5m');
    expect(chooseChartGranularity(7 * DAY_MS)).toBe('15m');
  });

  it('uses a half-day step for a year', () => {
    expect(chooseChartGranularity(365 * DAY_MS)).toBe('12h');
  });

  it('uses the coarsest step when even that exceeds the point budget', () => {
    expect(chooseChartGranularity(10 * 365 * DAY_MS)).toBe('1d');
  });

  it('never picks a step that would exceed the point budget when a coarser one exists', () => {
    const rangeMs = 30 * DAY_MS;
    const step = granularityToMs(chooseChartGranularity(rangeMs));

    expect(step).not.toBeNull();
    expect(rangeMs / (step ?? 1)).toBeLessThanOrEqual(1000);
  });
});
