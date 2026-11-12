import {
  CHART_GAP_STEP_FACTOR,
  CHART_MIN_PROFILE_POINTS,
  CHART_STALE_AFTER_MS,
  DATA_QUALITY_ISSUE_LABELS,
} from '../../constants/timeSeriesChart';
import { DataQualityIssue } from '../../enums/timeSeriesChart';
import type {
  ChartTimeRange,
  DataProfile,
  GapInterval,
  TimeSeriesPoint,
} from '../../types/timeSeriesChart';

import { computeStatistics, isValidReading, pointsInRange, typicalStepMs } from './statistics';

export function findGaps(points: readonly TimeSeriesPoint[]): GapInterval[] {
  const step = typicalStepMs(points);
  if (step === undefined) return [];
  const times = [...new Set(points.filter(isValidReading).map((point) => point.timestamp))].sort(
    (first, second) => first - second,
  );
  const gaps: GapInterval[] = [];
  for (let index = 1; index < times.length; index++) {
    const from = times[index - 1];
    const to = times[index];
    if (from !== undefined && to !== undefined && to - from > step * CHART_GAP_STEP_FACTOR)
      gaps.push({ from, to });
  }
  return gaps;
}

/**
 * Counts what is wrong with a series in a range: missing, invalid and flagged readings, duplicate timestamps, gaps and staleness
 *. Staleness is judged from the latest valid reading of the whole series, not only of the range.
 */
export function profileSeries(
  seriesId: string,
  allPoints: readonly TimeSeriesPoint[],
  range: ChartTimeRange,
  nowMs: number,
  staleAfterMs: number = CHART_STALE_AFTER_MS,
): DataProfile {
  const points = pointsInRange(allPoints, range).sort(
    (first, second) => first.timestamp - second.timestamp,
  );
  let missingCount = 0;
  let invalidCount = 0;
  let badQualityCount = 0;
  let duplicateTimestampCount = 0;
  let previousTimestamp: number | undefined;
  for (const point of points) {
    if (point.value === null) missingCount += 1;
    else if (!Number.isFinite(point.value)) invalidCount += 1;
    else if (point.isBadQuality === true) badQualityCount += 1;
    if (previousTimestamp === point.timestamp) duplicateTimestampCount += 1;
    previousTimestamp = point.timestamp;
  }
  const statistics = computeStatistics(points);
  const gaps = findGaps(points);
  const latestAt = allPoints
    .filter(isValidReading)
    .reduce<number | undefined>(
      (latest, point) =>
        latest === undefined || point.timestamp > latest ? point.timestamp : latest,
      undefined,
    );
  const isStale = latestAt === undefined || nowMs - latestAt > staleAfterMs;

  const warnings: DataProfile['warnings'] = [];
  const warn = (issue: DataQualityIssue, count: number): void => {
    warnings.push({ issue, message: `${DATA_QUALITY_ISSUE_LABELS[issue]}: ${count}` });
  };
  if (missingCount > 0) warn(DataQualityIssue.MISSING_VALUE, missingCount);
  if (invalidCount > 0) warn(DataQualityIssue.INVALID_VALUE, invalidCount);
  if (badQualityCount > 0) warn(DataQualityIssue.BAD_QUALITY, badQualityCount);
  if (duplicateTimestampCount > 0)
    warn(DataQualityIssue.DUPLICATE_TIMESTAMP, duplicateTimestampCount);
  if (gaps.length > 0) warn(DataQualityIssue.TIME_GAP, gaps.length);
  if (isStale)
    warnings.push({
      issue: DataQualityIssue.STALE,
      message:
        latestAt === undefined
          ? 'No valid reading at all.'
          : 'The latest valid reading is older than the freshness limit.',
    });
  if (statistics.count > 0 && statistics.count < CHART_MIN_PROFILE_POINTS)
    warnings.push({
      issue: DataQualityIssue.MISSING_VALUE,
      message: `Only ${statistics.count} valid readings in this range.`,
    });

  return {
    seriesId,
    validCount: statistics.count,
    missingCount,
    invalidCount,
    badQualityCount,
    duplicateTimestampCount,
    gaps,
    latestAt,
    isStale,
    statistics,
    warnings,
  };
}
