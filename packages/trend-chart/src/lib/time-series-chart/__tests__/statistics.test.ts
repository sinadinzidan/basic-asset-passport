import { describe, expect, it } from 'vitest';

import { MILLISECONDS_PER_MINUTE } from '../../../constants/monitoring';
import { createPoint, createPoints } from '../../../mocks/chartData';
import {
  computeStatistics,
  findExtremes,
  isValidReading,
  pointsInRange,
  typicalStepMs,
} from '../statistics';

const MINUTE_MS = MILLISECONDS_PER_MINUTE;

describe(isValidReading.name, () => {
  it('accepts a finite number that is not flagged', () => {
    expect(isValidReading(createPoint(0, 0))).toBe(true);
    expect(isValidReading(createPoint(0, -3.5, false))).toBe(true);
  });

  it('refuses a missing reading', () => {
    expect(isValidReading(createPoint(0, null))).toBe(false);
  });

  it('refuses a value that is not a finite number', () => {
    expect(isValidReading(createPoint(0, Number.NaN))).toBe(false);
    expect(isValidReading(createPoint(0, Number.POSITIVE_INFINITY))).toBe(false);
  });

  it('refuses a reading flagged as bad quality', () => {
    expect(isValidReading(createPoint(0, 5, true))).toBe(false);
  });
});

describe(pointsInRange.name, () => {
  it('keeps the readings from the start to the end of the range, both included', () => {
    const points = createPoints([1, 2, 3, 4, 5]);

    const kept = pointsInRange(points, { start: MINUTE_MS, end: 3 * MINUTE_MS });

    expect(kept.map((point) => point.value)).toEqual([2, 3, 4]);
  });

  it('returns a copy of every reading when there is no range', () => {
    const points = createPoints([1, 2]);

    const kept = pointsInRange(points, undefined);

    expect(kept).toEqual(points);
    expect(kept).not.toBe(points);
  });
});

describe(computeStatistics.name, () => {
  it('gives the lowest, highest and mean of the valid readings and how many there are', () => {
    const points = [...createPoints([2, 4, null, 9]), createPoint(4 * MINUTE_MS, 100, true)];

    expect(computeStatistics(points)).toEqual({ min: 2, max: 9, mean: 5, count: 3 });
  });

  it('counts only the readings in the range', () => {
    const points = createPoints([2, 4, 6, 100]);

    expect(computeStatistics(points, { start: 0, end: 2 * MINUTE_MS })).toEqual({
      min: 2,
      max: 6,
      mean: 4,
      count: 3,
    });
  });

  it('has no minimum, maximum or mean when there is no valid reading, rather than zero', () => {
    expect(computeStatistics(createPoints([null, null]))).toEqual({
      min: null,
      max: null,
      mean: null,
      count: 0,
    });
  });
});

describe(findExtremes.name, () => {
  it('returns the lowest and the highest valid reading with their time stamps', () => {
    const points = createPoints([5, 1, null, 9, 3]);

    expect(findExtremes(points)).toEqual({
      min: { timestamp: MINUTE_MS, value: 1 },
      max: { timestamp: 3 * MINUTE_MS, value: 9 },
    });
  });

  it('keeps the earliest reading when several share the extreme value', () => {
    const points = createPoints([7, 7, 7]);

    const extremes = findExtremes(points);

    expect(extremes.min?.timestamp).toBe(0);
    expect(extremes.max?.timestamp).toBe(0);
  });

  it('looks only at the readings in the range', () => {
    const points = createPoints([100, 2, 3, -100]);

    const extremes = findExtremes(points, { start: MINUTE_MS, end: 2 * MINUTE_MS });

    expect(extremes.min?.value).toBe(2);
    expect(extremes.max?.value).toBe(3);
  });

  it('has neither when there is no valid reading', () => {
    expect(findExtremes(createPoints([null]))).toEqual({ min: undefined, max: undefined });
  });
});

describe(typicalStepMs.name, () => {
  it('is the middle interval between readings, so one long gap does not change it', () => {
    const points = [0, 1, 2, 10].map((minute) => createPoint(minute * MINUTE_MS, 1));

    expect(typicalStepMs(points)).toBe(MINUTE_MS);
  });

  it('is the mean of the two middle intervals when there is an even number of them', () => {
    const points = [0, 1, 3].map((minute) => createPoint(minute * MINUTE_MS, 1));

    expect(typicalStepMs(points)).toBe(1.5 * MINUTE_MS);
  });

  it('takes the readings in time order, whatever order they come in', () => {
    const points = [2, 0, 1].map((minute) => createPoint(minute * MINUTE_MS, 1));

    expect(typicalStepMs(points)).toBe(MINUTE_MS);
  });

  it('ignores a repeated time stamp and readings that are not valid', () => {
    const points = [
      createPoint(0, 1),
      createPoint(0, 1),
      createPoint(MINUTE_MS / 2, null),
      createPoint(MINUTE_MS, 1),
      createPoint(2 * MINUTE_MS, 1),
    ];

    expect(typicalStepMs(points)).toBe(MINUTE_MS);
  });

  it('is unknown with fewer than two valid readings', () => {
    expect(typicalStepMs([])).toBeUndefined();
    expect(typicalStepMs(createPoints([1, null]))).toBeUndefined();
  });
});
