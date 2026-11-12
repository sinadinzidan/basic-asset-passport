import { HALF } from '../../constants/mathConstants';
import { LIVE_MAX_POINTS, LIVE_STEP_MS } from '../../constants/timeSeriesChart';
import type { TimeSeriesPoint } from '../../types/timeSeriesChart';
import { createRandom } from '../prng';

import { computeStatistics, isValidReading } from './statistics';

const HASH_MULTIPLIER = 31;
const RECENT_POINT_COUNT = 200;
const SYMMETRIC_RANGE = 2;
const VALUE_FRACTION_DIGITS = 4;

const MEAN_REVERSION = 0.15;
const NOISE_SHARE_OF_SPREAD = 0.08;
const FALLBACK_SPREAD = 1;

function seedOf(text: string, timestamp: number): number {
  let hash = timestamp >>> 0;
  for (let index = 0; index < text.length; index++)
    hash = (Math.imul(hash, HASH_MULTIPLIER) + text.charCodeAt(index)) >>> 0;
  return hash;
}

/**
 * The next reading of the simulated live feed: a mean-reverting step around what the series has been doing, so it looks
 * like the signal but is plainly generated. The same series, step and history always give the same value.
 */
export function simulateNextPoint(
  seriesId: string,
  points: readonly TimeSeriesPoint[],
  stepMs: number = LIVE_STEP_MS,
): TimeSeriesPoint | undefined {
  const valid = points.filter(isValidReading);
  const last = valid[valid.length - 1];
  if (!last) return undefined;
  const statistics = computeStatistics(valid.slice(-RECENT_POINT_COUNT));
  const spread =
    statistics.min !== null && statistics.max !== null && statistics.max > statistics.min
      ? statistics.max - statistics.min
      : FALLBACK_SPREAD;
  const mean = statistics.mean ?? last.value;
  const timestamp = last.timestamp + stepMs;
  const random = createRandom(seedOf(seriesId, timestamp));
  const noise = (random.next() - HALF) * SYMMETRIC_RANGE * spread * NOISE_SHARE_OF_SPREAD;
  const value = last.value + (mean - last.value) * MEAN_REVERSION + noise;
  return { timestamp, value: Number(value.toFixed(VALUE_FRACTION_DIGITS)) };
}

export function appendPoint(
  points: readonly TimeSeriesPoint[],
  next: TimeSeriesPoint,
  maximum: number = LIVE_MAX_POINTS,
): TimeSeriesPoint[] {
  const combined = [...points, next];
  return combined.length > maximum ? combined.slice(combined.length - maximum) : combined;
}
