import type { ThresholdSource } from '../../enums/timeSeriesChart';
import { ThresholdLevel, ThresholdSide } from '../../enums/timeSeriesChart';
import type { ChartThreshold, ChartTimeRange, ThresholdBreach, TimeSeriesPoint } from '../../types/timeSeriesChart';

import { isValidReading, pointsInRange } from './statistics';

export interface LimitInput {
  seriesId: string;
  unit: string;
  alertLow?: number;
  alertHigh?: number;
  dangerLow?: number;
  dangerHigh?: number;
}

/** Thresholds exactly as supplied by the data source or configured; none are inferred from the observed minimum and maximum. */
export function thresholdsFromLimits(limits: LimitInput, source: ThresholdSource): ChartThreshold[] {
  const entries: Array<{ level: ThresholdLevel; side: ThresholdSide; value: number | undefined }> = [
    { level: ThresholdLevel.ALERT, side: ThresholdSide.UPPER, value: limits.alertHigh },
    { level: ThresholdLevel.DANGER, side: ThresholdSide.UPPER, value: limits.dangerHigh },
    { level: ThresholdLevel.ALERT, side: ThresholdSide.LOWER, value: limits.alertLow },
    { level: ThresholdLevel.DANGER, side: ThresholdSide.LOWER, value: limits.dangerLow },
  ];
  return entries.flatMap((entry) =>
    entry.value === undefined
      ? []
      : [
          {
            id: `${limits.seriesId}:${entry.level}:${entry.side}`,
            seriesId: limits.seriesId,
            level: entry.level,
            side: entry.side,
            value: entry.value,
            unit: limits.unit,
            source,
          },
        ],
  );
}

export function isBeyondThreshold(value: number, threshold: ChartThreshold): boolean {
  return threshold.side === ThresholdSide.UPPER ? value > threshold.value : value < threshold.value;
}

export function findBreaches(
  points: readonly TimeSeriesPoint[],
  thresholds: readonly ChartThreshold[],
  range?: ChartTimeRange,
): ThresholdBreach[] {
  const sorted = pointsInRange(points, range)
    .filter(isValidReading)
    .sort((first, second) => first.timestamp - second.timestamp);
  const breaches: ThresholdBreach[] = [];
  for (const threshold of thresholds) {
    let run: { from: number; to: number; peak: number } | undefined;
    for (const point of sorted) {
      if (isBeyondThreshold(point.value, threshold)) {
        const isMoreExtreme =
          run === undefined ||
          (threshold.side === ThresholdSide.UPPER ? point.value > run.peak : point.value < run.peak);
        run = run
          ? { from: run.from, to: point.timestamp, peak: isMoreExtreme ? point.value : run.peak }
          : { from: point.timestamp, to: point.timestamp, peak: point.value };
      } else if (run) {
        breaches.push({ threshold, ...run });
        run = undefined;
      }
    }
    if (run) breaches.push({ threshold, ...run });
  }
  return breaches.sort((first, second) => first.from - second.from);
}

export function countBeyond(
  points: readonly TimeSeriesPoint[],
  threshold: ChartThreshold,
  range?: ChartTimeRange,
): number {
  return pointsInRange(points, range)
    .filter(isValidReading)
    .filter((point) => isBeyondThreshold(point.value, threshold)).length;
}
