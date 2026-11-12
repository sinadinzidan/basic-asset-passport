import { describe, expect, it } from 'vitest';

import { MILLISECONDS_PER_MINUTE } from '../../../constants/monitoring';
import { createPoint } from '../../../mocks/chartData';
import type { TimeSeriesPoint } from '../../../types/timeSeriesChart';
import { thinPoints } from '../thinPoints';

const MINUTE_MS = MILLISECONDS_PER_MINUTE;
const POINT_COUNT = 30;
const SPIKE_INDEX = 14;
const DIP_INDEX = 25;
const MISSING_INDEX = 5;

describe(thinPoints.name, () => {
  it('returns the very same readings when there are no more than the cap', () => {
    const points = rampWithIncidents();

    expect(thinPoints(points, POINT_COUNT)).toBe(points);
  });

  it('thins a longer series to no more than the cap', () => {
    const thinned = thinPoints(rampWithIncidents(), 9);

    expect(thinned.length).toBeLessThanOrEqual(9);
    expect(thinned.length).toBeLessThan(POINT_COUNT);
  });

  it('keeps a spike and a dip, so thinning never smooths them away', () => {
    const thinned = thinPoints(rampWithIncidents(), 9);

    expect(minutesOf(thinned)).toContain(SPIKE_INDEX);
    expect(minutesOf(thinned)).toContain(DIP_INDEX);
  });

  it('keeps a missing reading, so a hole in the data still shows', () => {
    const thinned = thinPoints(rampWithIncidents(), 9);

    expect(thinned).toContainEqual(createPoint(MISSING_INDEX * MINUTE_MS, null));
  });

  it('keeps the first and the last reading', () => {
    const minutes = minutesOf(thinPoints(rampWithIncidents(), 9));

    expect(minutes[0]).toBe(0);
    expect(minutes[minutes.length - 1]).toBe(POINT_COUNT - 1);
  });

  it('gives the readings in time order, each one once', () => {
    const minutes = minutesOf(thinPoints(rampWithIncidents(), 9));

    expect(minutes).toEqual([...new Set(minutes)].sort((first, second) => first - second));
  });

  it('still keeps the ends and the extremes under a cap too small to slice', () => {
    const points = [3, 9, 1, 5].map((value, index) => createPoint(index * MINUTE_MS, value));

    const thinned = thinPoints(points, 2);

    expect(thinned.map((point) => point.value)).toEqual([3, 9, 1, 5]);
  });
});

/** A rising line with one spike, one dip and one missing reading. */
function rampWithIncidents(): TimeSeriesPoint[] {
  return Array.from({ length: POINT_COUNT }, (_unused, index) =>
    createPoint(index * MINUTE_MS, valueAt(index)),
  );
}

function valueAt(index: number): number | null {
  if (index === SPIKE_INDEX) return 1000;
  if (index === DIP_INDEX) return -1000;
  if (index === MISSING_INDEX) return null;
  return index;
}

function minutesOf(points: readonly TimeSeriesPoint[]): number[] {
  return points.map((point) => point.timestamp / MINUTE_MS);
}
