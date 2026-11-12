import { describe, expect, it } from 'vitest';

import { MILLISECONDS_PER_MINUTE } from '../../../constants/monitoring';
import { LIVE_STEP_MS } from '../../../constants/timeSeriesChart';
import { createPoint, createPoints } from '../../../mocks/chartData';
import { appendPoint, simulateNextPoint } from '../live';

const MINUTE_MS = MILLISECONDS_PER_MINUTE;
const HISTORY = createPoints([10, 12, 14, 16, 20]);
const HISTORY_END_MS = 4 * MINUTE_MS;
/** Where the history pulls the next value: the last reading, drawn 15% of the way back to the mean of 14.4. */
const HISTORY_PULL = 19.16;
/** The most the noise adds or takes away: 8% of the history's spread of 10. */
const HISTORY_NOISE = 0.8;

describe(simulateNextPoint.name, () => {
  it('has nothing to simulate from when the series has no valid reading', () => {
    expect(simulateNextPoint('s1', [])).toBeUndefined();
    expect(simulateNextPoint('s1', createPoints([null]))).toBeUndefined();
  });

  it('comes one live step after the last reading', () => {
    expect(simulateNextPoint('s1', HISTORY)?.timestamp).toBe(HISTORY_END_MS + LIVE_STEP_MS);
  });

  it('comes after the step it is given', () => {
    expect(simulateNextPoint('s1', HISTORY, 5000)?.timestamp).toBe(HISTORY_END_MS + 5000);
  });

  it('follows the last valid reading, not a missing one after it', () => {
    const points = [...HISTORY, createPoint(HISTORY_END_MS + MINUTE_MS, null)];

    expect(simulateNextPoint('s1', points)?.timestamp).toBe(HISTORY_END_MS + LIVE_STEP_MS);
  });

  it('gives the same value for the same series and history', () => {
    expect(simulateNextPoint('s1', HISTORY)).toEqual(simulateNextPoint('s1', HISTORY));
  });

  it('gives another value for another series with the same history', () => {
    expect(simulateNextPoint('s1', HISTORY)?.value).not.toBe(
      simulateNextPoint('s2', HISTORY)?.value,
    );
  });

  it('stays near the last reading, pulled a little towards the mean of the series', () => {
    const value = simulateNextPoint('s1', HISTORY)?.value ?? Number.NaN;

    expect(value).toBeGreaterThanOrEqual(HISTORY_PULL - HISTORY_NOISE);
    expect(value).toBeLessThanOrEqual(HISTORY_PULL + HISTORY_NOISE);
  });

  it('still moves a little on a flat series', () => {
    const value = simulateNextPoint('s1', createPoints([5, 5, 5]))?.value ?? Number.NaN;

    expect(Math.abs(value - 5)).toBeLessThanOrEqual(0.08);
    expect(value).not.toBe(5);
  });

  it('rounds the value to four decimals', () => {
    const value = simulateNextPoint('s1', HISTORY)?.value ?? Number.NaN;

    expect(value).toBe(Number(value.toFixed(4)));
  });
});

describe(appendPoint.name, () => {
  it('adds the reading at the end, leaving the given readings as they were', () => {
    const points = createPoints([1, 2]);
    const next = createPoint(2 * MINUTE_MS, 3);

    const combined = appendPoint(points, next);

    expect(combined).toEqual([...points, next]);
    expect(points).toHaveLength(2);
  });

  it('drops the oldest readings beyond the maximum', () => {
    const points = createPoints([1, 2, 3]);

    const combined = appendPoint(points, createPoint(3 * MINUTE_MS, 4), 3);

    expect(combined.map((point) => point.value)).toEqual([2, 3, 4]);
  });
});
