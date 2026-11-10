import { CHART_INTERPOLATION_STEP_FACTOR, CHART_NEAREST_STEP_FACTOR } from '../../constants/timeSeriesChart';
import { ReadingKind } from '../../enums/timeSeriesChart';
import type { MarkerReading, TimeSeriesPoint } from '../../types/timeSeriesChart';

import { isValidReading, typicalStepMs } from './statistics';

export interface ReadingOptions {
  interpolate: boolean;
}

/**
 * What a series reads at an instant: an exact reading when one exists at that timestamp; otherwise the nearest
 * reading with its own timestamp, or a linear interpolation only when asked for, and then labelled. Beyond a step and a half
 * (or three steps, interpolated) the reading is missing rather than invented.
 */
export function readingAt(
  seriesId: string,
  points: readonly TimeSeriesPoint[],
  atMs: number,
  options: ReadingOptions,
): MarkerReading {
  const valid = points.filter(isValidReading).sort((first, second) => first.timestamp - second.timestamp);
  const missing: MarkerReading = { seriesId, kind: ReadingKind.MISSING, value: null };
  if (valid.length === 0) return missing;
  const exact = valid.find((point) => point.timestamp === atMs);
  if (exact) return { seriesId, kind: ReadingKind.EXACT, value: exact.value, readingAt: exact.timestamp };

  const step = typicalStepMs(valid);
  let before: (TimeSeriesPoint & { value: number }) | undefined;
  let after: (TimeSeriesPoint & { value: number }) | undefined;
  for (const point of valid) {
    if (point.timestamp < atMs) before = point;
    else {
      after = point;
      break;
    }
  }

  if (options.interpolate && before && after) {
    const span = after.timestamp - before.timestamp;
    if (step === undefined || span <= step * CHART_INTERPOLATION_STEP_FACTOR) {
      const ratio = (atMs - before.timestamp) / span;
      return { seriesId, kind: ReadingKind.INTERPOLATED, value: before.value + (after.value - before.value) * ratio };
    }
    return missing;
  }

  const candidates = [before, after].filter(
    (point): point is TimeSeriesPoint & { value: number } => point !== undefined,
  );
  let nearest: (TimeSeriesPoint & { value: number }) | undefined;
  for (const candidate of candidates) {
    if (nearest === undefined || Math.abs(candidate.timestamp - atMs) < Math.abs(nearest.timestamp - atMs))
      nearest = candidate;
  }
  if (!nearest) return missing;
  const tolerance = step === undefined ? 0 : step * CHART_NEAREST_STEP_FACTOR;
  if (Math.abs(nearest.timestamp - atMs) > tolerance) return missing;
  return { seriesId, kind: ReadingKind.NEAREST, value: nearest.value, readingAt: nearest.timestamp };
}
