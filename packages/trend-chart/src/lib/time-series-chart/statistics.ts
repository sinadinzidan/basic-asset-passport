import { HALF, PARITY_DIVISOR } from '../../constants/mathConstants';
import type {
  ChartTimeRange,
  SeriesStatistics,
  TimeSeriesPoint,
} from '../../types/timeSeriesChart';

/** A reading that can take part in a calculation: a finite number not flagged as bad quality. A missing value is never zero. */
export function isValidReading(
  point: TimeSeriesPoint,
): point is TimeSeriesPoint & { value: number } {
  return point.value !== null && Number.isFinite(point.value) && point.isBadQuality !== true;
}

export function pointsInRange(
  points: readonly TimeSeriesPoint[],
  range: ChartTimeRange | undefined,
): TimeSeriesPoint[] {
  return range
    ? points.filter((point) => point.timestamp >= range.start && point.timestamp <= range.end)
    : [...points];
}

export function computeStatistics(
  points: readonly TimeSeriesPoint[],
  range?: ChartTimeRange,
): SeriesStatistics {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let sum = 0;
  let count = 0;
  for (const point of pointsInRange(points, range)) {
    if (!isValidReading(point)) continue;
    min = Math.min(min, point.value);
    max = Math.max(max, point.value);
    sum += point.value;
    count += 1;
  }
  if (count === 0) return { min: null, max: null, mean: null, count: 0 };
  return { min, max, mean: sum / count, count };
}

export function findExtremes(
  points: readonly TimeSeriesPoint[],
  range?: ChartTimeRange,
): { min?: TimeSeriesPoint & { value: number }; max?: TimeSeriesPoint & { value: number } } {
  let min: (TimeSeriesPoint & { value: number }) | undefined;
  let max: (TimeSeriesPoint & { value: number }) | undefined;
  for (const point of pointsInRange(points, range)) {
    if (!isValidReading(point)) continue;
    if (min === undefined || point.value < min.value) min = point;
    if (max === undefined || point.value > max.value) max = point;
  }
  return { min, max };
}

export function typicalStepMs(points: readonly TimeSeriesPoint[]): number | undefined {
  const times = [...new Set(points.filter(isValidReading).map((point) => point.timestamp))].sort(
    (first, second) => first - second,
  );
  const steps: number[] = [];
  for (let index = 1; index < times.length; index++) {
    const current = times[index];
    const previous = times[index - 1];
    if (current !== undefined && previous !== undefined) steps.push(current - previous);
  }
  if (steps.length === 0) return undefined;
  steps.sort((first, second) => first - second);
  const middle = Math.floor(steps.length * HALF);
  const low = steps[middle - 1];
  const high = steps[middle];
  if (high === undefined) return undefined;
  return steps.length % PARITY_DIVISOR === 1 || low === undefined ? high : (low + high) * HALF;
}
