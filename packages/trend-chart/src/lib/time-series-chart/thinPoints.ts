import type { TimeSeriesPoint } from '../../types/timeSeriesChart';

import { isValidReading } from './statistics';

const KEPT_PER_SLICE = 3;

/**
 * The safety cap of the chart's data path: a series of more than `maxPoints` readings is thinned to about that many by cutting it into
 * slices and keeping, of each, its lowest and highest reading and its first flagged or missing one, so a spike or a gap is never
 * smoothed away. The first and last readings are always kept. Readings are expected in time order and the result is too. A series
 * within the cap is returned as it is, the same array, so nothing downstream sees a change.
 */
export function thinPoints(
  points: readonly TimeSeriesPoint[],
  maxPoints: number,
): readonly TimeSeriesPoint[] {
  if (points.length <= maxPoints) return points;
  const sliceCount = Math.max(1, Math.floor(maxPoints / KEPT_PER_SLICE));
  const sliceSize = points.length / sliceCount;
  const kept = new Set<TimeSeriesPoint>();
  const first = points[0];
  const last = points[points.length - 1];
  if (first) kept.add(first);
  if (last) kept.add(last);
  for (let slice = 0; slice < sliceCount; slice++) {
    const end = Math.floor((slice + 1) * sliceSize);
    let lowest: (TimeSeriesPoint & { value: number }) | undefined;
    let highest: (TimeSeriesPoint & { value: number }) | undefined;
    let firstUnusable: TimeSeriesPoint | undefined;
    for (let index = Math.floor(slice * sliceSize); index < end; index++) {
      const point = points[index];
      if (!point) continue;
      if (!isValidReading(point)) {
        firstUnusable ??= point;
        continue;
      }
      if (lowest === undefined || point.value < lowest.value) lowest = point;
      if (highest === undefined || point.value > highest.value) highest = point;
    }
    for (const point of [lowest, highest, firstUnusable]) if (point) kept.add(point);
  }
  return [...kept].sort((earlier, later) => earlier.timestamp - later.timestamp);
}
