import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { MILLISECONDS_PER_DAY, MILLISECONDS_PER_HOUR } from '../../../constants/formats';
import { CHART_ALL_HISTORY_DAYS, MILLISECONDS_PER_MINUTE } from '../../../constants/monitoring';
import { ChartRange } from '../../../enums/monitoring';
import { createPoint, createPoints } from '../../../mocks/chartData';
import { setChartTimeZone } from '../../timeZone';
import {
  aggregateReadings,
  buildTimeTicks,
  findGapSpans,
  formatChartTick,
  groupAxesByUnit,
  nearestBucket,
  niceScale,
  normaliseValue,
  observedExtent,
  resolveChartWindow,
  splitIntoRuns,
} from '../chartModel';
import type { ChartBucket } from '../chartModel';

const MINUTE_MS = MILLISECONDS_PER_MINUTE;
const HOUR_MS = MILLISECONDS_PER_HOUR;
const DAY_MS = MILLISECONDS_PER_DAY;
const NOW_MS = Date.UTC(2026, 9, 1, 8, 5, 42);
const EIGHT_MINUTES = { fromMs: 0, toMs: 8 * MINUTE_MS };

// The host app may have set its own zone; these tests start from the chart's default.
beforeEach(() => setChartTimeZone({ id: 'UTC', label: 'UTC' }));
afterEach(() => setChartTimeZone({ id: 'UTC', label: 'UTC' }));

describe(resolveChartWindow.name, () => {
  it('ends now and reaches back as far as the range says', () => {
    expect(resolveChartWindow(ChartRange.ONE_HOUR, NOW_MS)).toEqual({
      fromMs: NOW_MS - HOUR_MS,
      toMs: NOW_MS,
    });
    expect(resolveChartWindow(ChartRange.ONE_DAY, NOW_MS)).toEqual({
      fromMs: NOW_MS - DAY_MS,
      toMs: NOW_MS,
    });
  });

  it('reaches back over the whole history the chart keeps', () => {
    expect(resolveChartWindow(ChartRange.ALL_HISTORY, NOW_MS)).toEqual({
      fromMs: NOW_MS - CHART_ALL_HISTORY_DAYS * DAY_MS,
      toMs: NOW_MS,
    });
  });

  it('is the custom window when the range is custom', () => {
    const custom = { fromMs: NOW_MS - 3 * HOUR_MS, toMs: NOW_MS - HOUR_MS };

    expect(resolveChartWindow(ChartRange.CUSTOM, NOW_MS, custom)).toBe(custom);
  });

  it('falls back to the last week when the custom window is absent', () => {
    expect(resolveChartWindow(ChartRange.CUSTOM, NOW_MS)).toEqual({
      fromMs: NOW_MS - 7 * DAY_MS,
      toMs: NOW_MS,
    });
  });

  it('falls back to the last week when the custom window ends before it starts', () => {
    const backwards = { fromMs: NOW_MS, toMs: NOW_MS - HOUR_MS };

    expect(resolveChartWindow(ChartRange.CUSTOM, NOW_MS, backwards)).toEqual({
      fromMs: NOW_MS - 7 * DAY_MS,
      toMs: NOW_MS,
    });
  });
});

describe(aggregateReadings.name, () => {
  it('gives one bucket per reading when there are no more readings than buckets', () => {
    const buckets = aggregateReadings(createPoints([1, 2]), EIGHT_MINUTES, 10);

    expect(buckets).toEqual([bucket(0, 1), bucket(MINUTE_MS, 2)]);
  });

  it('gives a missing reading a bucket without a value, so the line breaks there', () => {
    const buckets = aggregateReadings(createPoints([1, null]), EIGHT_MINUTES, 10);

    expect(buckets[1]).toEqual(emptyBucket(MINUTE_MS));
  });

  it('counts a flagged reading but leaves its value out', () => {
    const buckets = aggregateReadings([createPoint(0, 50, true)], EIGHT_MINUTES, 10);

    expect(buckets).toEqual([{ ...emptyBucket(0), flaggedCount: 1 }]);
  });

  it('leaves out the readings outside the window, keeping those on its edges', () => {
    const points = createPoints([1, 2, 3, 4]);

    const buckets = aggregateReadings(points, { fromMs: MINUTE_MS, toMs: 2 * MINUTE_MS }, 10);

    expect(buckets.map((entry) => entry.average)).toEqual([2, 3]);
  });

  it('averages the readings into equal buckets when there are more readings than buckets', () => {
    const buckets = aggregateReadings(createPoints([1, 2, 3, 4, 5, 6, 7, 8]), EIGHT_MINUTES, 2);

    expect(buckets).toEqual([
      { atMs: 2 * MINUTE_MS, average: 2.5, minimum: 1, maximum: 4, goodCount: 4, flaggedCount: 0 },
      { atMs: 6 * MINUTE_MS, average: 6.5, minimum: 5, maximum: 8, goodCount: 4, flaggedCount: 0 },
    ]);
  });

  it('leaves flagged and missing readings out of every aggregate', () => {
    const points = [
      createPoint(0, 2),
      createPoint(MINUTE_MS, 1000, true),
      createPoint(2 * MINUTE_MS, null),
    ];

    const [first] = aggregateReadings(points, EIGHT_MINUTES, 2);

    expect(first).toEqual({
      atMs: 2 * MINUTE_MS,
      average: 2,
      minimum: 2,
      maximum: 2,
      goodCount: 1,
      flaggedCount: 1,
    });
  });

  it('gives a bucket without a good reading no value', () => {
    const buckets = aggregateReadings(createPoints([1, 2, 3]), EIGHT_MINUTES, 2);

    expect(buckets[1]).toEqual(emptyBucket(6 * MINUTE_MS));
  });

  it('puts a reading at the very end of the window into the last bucket', () => {
    const points = [...createPoints([1, 2]), createPoint(8 * MINUTE_MS, 9)];

    const buckets = aggregateReadings(points, EIGHT_MINUTES, 2);

    expect(buckets[1]?.average).toBe(9);
  });
});

describe(splitIntoRuns.name, () => {
  it('splits the buckets into runs wherever a bucket has no value', () => {
    const buckets = [
      bucket(0, 1),
      bucket(1, 2),
      emptyBucket(2),
      bucket(3, 3),
      emptyBucket(4),
      emptyBucket(5),
    ];

    const runs = splitIntoRuns([...buckets, bucket(6, 4)]);

    expect(runs.map((run) => run.map((entry) => entry.average))).toEqual([[1, 2], [3], [4]]);
  });

  it('has no run when no bucket has a value', () => {
    expect(splitIntoRuns([emptyBucket(0), emptyBucket(1)])).toEqual([]);
  });
});

describe(findGapSpans.name, () => {
  it('spans a gap from the last value before it to the first value after it', () => {
    const buckets = [
      bucket(MINUTE_MS, 1),
      bucket(2 * MINUTE_MS, 2),
      emptyBucket(3 * MINUTE_MS),
      bucket(4 * MINUTE_MS, 3),
    ];

    expect(findGapSpans(buckets, EIGHT_MINUTES)).toEqual([
      { fromMs: 2 * MINUTE_MS, toMs: 4 * MINUTE_MS },
    ]);
  });

  it('starts a gap at the start of the window when no value comes before it', () => {
    const buckets = [emptyBucket(MINUTE_MS), bucket(2 * MINUTE_MS, 1)];

    expect(findGapSpans(buckets, EIGHT_MINUTES)).toEqual([{ fromMs: 0, toMs: 2 * MINUTE_MS }]);
  });

  it('ends a gap at the end of the window when no value comes after it', () => {
    const buckets = [bucket(MINUTE_MS, 1), emptyBucket(2 * MINUTE_MS)];

    expect(findGapSpans(buckets, EIGHT_MINUTES)).toEqual([
      { fromMs: MINUTE_MS, toMs: 8 * MINUTE_MS },
    ]);
  });

  it('finds no gap when every bucket has a value', () => {
    expect(findGapSpans([bucket(MINUTE_MS, 1), bucket(2 * MINUTE_MS, 2)], EIGHT_MINUTES)).toEqual(
      [],
    );
  });

  it('takes the whole window for a gap when there is no bucket at all', () => {
    expect(findGapSpans([], EIGHT_MINUTES)).toEqual([{ fromMs: 0, toMs: 8 * MINUTE_MS }]);
  });
});

describe(nearestBucket.name, () => {
  const buckets = [bucket(0, 1), bucket(MINUTE_MS, 2), bucket(2 * MINUTE_MS, 3)];

  it('finds the bucket nearest to the instant', () => {
    expect(nearestBucket(buckets, 1.2 * MINUTE_MS, MINUTE_MS)).toBe(buckets[1]);
  });

  it('finds nothing when the nearest bucket is beyond the tolerance', () => {
    expect(nearestBucket(buckets, 10 * MINUTE_MS, MINUTE_MS)).toBeUndefined();
  });

  it('accepts a bucket exactly at the tolerance', () => {
    expect(nearestBucket(buckets, 3 * MINUTE_MS, MINUTE_MS)).toBe(buckets[2]);
  });

  it('finds nothing when the nearest bucket has no value, rather than borrowing a neighbour', () => {
    const withHole = [bucket(0, 1), emptyBucket(MINUTE_MS), bucket(2 * MINUTE_MS, 3)];

    expect(nearestBucket(withHole, 1.2 * MINUTE_MS, 5 * MINUTE_MS)).toBeUndefined();
  });

  it('finds nothing among no buckets', () => {
    expect(nearestBucket([], 0, MINUTE_MS)).toBeUndefined();
  });
});

describe(niceScale.name, () => {
  it('rounds the range out to round numbers with round steps', () => {
    expect(niceScale(3, 97)).toEqual({ minimum: 0, maximum: 100, ticks: [0, 20, 40, 60, 80, 100] });
  });

  it('keeps a range that is already round', () => {
    expect(niceScale(0, 100)).toEqual({
      minimum: 0,
      maximum: 100,
      ticks: [0, 20, 40, 60, 80, 100],
    });
  });

  it('makes fewer, wider steps for a smaller tick target', () => {
    expect(niceScale(0, 100, 2).ticks).toEqual([0, 50, 100]);
  });

  it('gives ticks without floating-point noise', () => {
    expect(niceScale(0.1, 0.9).ticks).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
  });

  it('opens up a flat range by a tenth of the value on each side', () => {
    expect(niceScale(200, 200)).toEqual({
      minimum: 180,
      maximum: 220,
      ticks: [180, 190, 200, 210, 220],
    });
  });

  it('opens up a flat range of a small value by one on each side', () => {
    expect(niceScale(5, 5)).toEqual({ minimum: 4, maximum: 6, ticks: [4, 4.5, 5, 5.5, 6] });
  });

  it('falls back to zero to one when a limit is not a number', () => {
    expect(niceScale(Number.NaN, 10)).toEqual({ minimum: 0, maximum: 1, ticks: [0, 1] });
    expect(niceScale(0, Number.POSITIVE_INFINITY)).toEqual({
      minimum: 0,
      maximum: 1,
      ticks: [0, 1],
    });
  });
});

describe(buildTimeTicks.name, () => {
  it('spreads six ticks evenly from the start to the end of the window', () => {
    const ticks = buildTimeTicks({ fromMs: 0, toMs: 50 * MINUTE_MS });

    expect(ticks).toEqual([0, 10, 20, 30, 40, 50].map((minute) => minute * MINUTE_MS));
  });

  it('makes as many ticks as it is asked for', () => {
    expect(buildTimeTicks({ fromMs: 0, toMs: 50 * MINUTE_MS }, 3)).toEqual([
      0,
      25 * MINUTE_MS,
      50 * MINUTE_MS,
    ]);
  });
});

describe(formatChartTick.name, () => {
  it('shows the seconds in a window of up to ten minutes', () => {
    expect(formatChartTick(NOW_MS, 10 * MINUTE_MS)).toBe('08:05:42');
  });

  it('shows the time of day in a window of up to a day', () => {
    expect(formatChartTick(NOW_MS, DAY_MS)).toBe('08:05');
  });

  it('shows the day and the time in a window of up to three days', () => {
    expect(formatChartTick(NOW_MS, 3 * DAY_MS)).toBe('01 Oct 08:05');
  });

  it('shows the day and the month in a window of up to about three months', () => {
    expect(formatChartTick(NOW_MS, 95 * DAY_MS)).toBe('01 Oct');
  });

  it('shows the month and a short year in a window of up to about a year', () => {
    expect(formatChartTick(NOW_MS, 400 * DAY_MS)).toBe('Oct 26');
  });

  it('shows the month and the full year in a longer window', () => {
    expect(formatChartTick(NOW_MS, 401 * DAY_MS)).toBe('Oct 2026');
  });

  it('shows the time on the wall clock of the chart zone', () => {
    setChartTimeZone({ id: 'Asia/Dubai', label: 'GST' });

    expect(formatChartTick(NOW_MS, HOUR_MS)).toBe('12:05');
  });
});

describe(groupAxesByUnit.name, () => {
  it('puts the series of one unit into one group, in the order the units first appear', () => {
    const series = [
      { id: 'a', unit: 'bar' },
      { id: 'b', unit: '°C' },
      { id: 'c', unit: 'bar' },
    ];

    expect(groupAxesByUnit(series)).toEqual({
      groups: [
        { unit: 'bar', seriesIds: ['a', 'c'] },
        { unit: '°C', seriesIds: ['b'] },
      ],
    });
  });

  it('has no group without series', () => {
    expect(groupAxesByUnit([])).toEqual({ groups: [] });
  });
});

describe(normaliseValue.name, () => {
  it('places a value as a percentage between the minimum and the maximum', () => {
    expect(normaliseValue(0, 0, 10)).toBe(0);
    expect(normaliseValue(2.5, 0, 10)).toBe(25);
    expect(normaliseValue(10, 0, 10)).toBe(100);
  });

  it('goes beyond the percentage range for a value outside the extent', () => {
    expect(normaliseValue(15, 0, 10)).toBe(150);
  });

  it('puts every value of a flat series in the middle', () => {
    expect(normaliseValue(7, 7, 7)).toBe(50);
  });
});

describe(observedExtent.name, () => {
  it('is the lowest minimum and the highest maximum of the buckets', () => {
    const buckets: ChartBucket[] = [
      { atMs: 0, average: 5, minimum: 2, maximum: 8, goodCount: 3, flaggedCount: 0 },
      { atMs: 1, average: 6, minimum: 4, maximum: 11, goodCount: 3, flaggedCount: 0 },
    ];

    expect(observedExtent(buckets)).toEqual({ minimum: 2, maximum: 11 });
  });

  it('passes over the buckets without a value', () => {
    expect(observedExtent([emptyBucket(0), bucket(1, 5)])).toEqual({ minimum: 5, maximum: 5 });
  });

  it('is undefined when no bucket has a value', () => {
    expect(observedExtent([emptyBucket(0)])).toBeUndefined();
    expect(observedExtent([])).toBeUndefined();
  });
});

function bucket(atMs: number, value: number): ChartBucket {
  return { atMs, average: value, minimum: value, maximum: value, goodCount: 1, flaggedCount: 0 };
}

function emptyBucket(atMs: number): ChartBucket {
  return { atMs, average: null, minimum: null, maximum: null, goodCount: 0, flaggedCount: 0 };
}
