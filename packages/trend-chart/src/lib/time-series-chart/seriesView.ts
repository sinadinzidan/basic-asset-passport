import { CHART_STALE_AFTER_MS } from '../../constants/timeSeriesChart';
import { SeriesDataStatus } from '../../enums/timeSeriesChart';
import type {
  ChartSeriesView,
  ChartThreshold,
  MonitoringSnapshot,
  TimeSeriesPoint,
} from '../../types/timeSeriesChart';

import { isValidReading } from './statistics';
import { convertValue } from './units';

export function deriveSeriesStatus(input: {
  isLoading: boolean;
  hasError: boolean;
  points: readonly TimeSeriesPoint[];
  nowMs: number;
  staleAfterMs?: number;
}): SeriesDataStatus {
  if (input.hasError) return SeriesDataStatus.ERROR;
  if (input.isLoading) return SeriesDataStatus.LOADING;
  const latest = input.points
    .filter(isValidReading)
    .reduce<number | undefined>(
      (found, point) => (found === undefined || point.timestamp > found ? point.timestamp : found),
      undefined,
    );
  if (latest === undefined) return SeriesDataStatus.NO_DATA;
  return input.nowMs - latest > (input.staleAfterMs ?? CHART_STALE_AFTER_MS)
    ? SeriesDataStatus.STALE
    : SeriesDataStatus.OK;
}

/** The readings in another unit; an unknown conversion returns them unchanged and the caller keeps the own unit (never applied silently). */
export function convertPoints(
  points: readonly TimeSeriesPoint[],
  from: string | undefined,
  to: string | undefined,
): TimeSeriesPoint[] {
  if (from === to) return [...points];
  return points.map((point) => {
    if (point.value === null) return point;
    const converted = convertValue(point.value, from, to);
    return converted === undefined ? point : { ...point, value: converted };
  });
}

export function convertThresholds(
  thresholds: readonly ChartThreshold[],
  from: string | undefined,
  to: string | undefined,
): ChartThreshold[] {
  if (from === to) return [...thresholds];
  return thresholds.map((threshold) => {
    const converted = convertValue(threshold.value, from, to);
    return converted === undefined
      ? threshold
      : { ...threshold, value: converted, unit: to ?? threshold.unit };
  });
}

/** The latest valid reading of each series, its age and its status, for the Monitoring panel. A live feed is always simulated. */
export function buildMonitoringSnapshots(
  series: readonly ChartSeriesView[],
  nowMs: number,
  isLiveSimulated: boolean,
): MonitoringSnapshot[] {
  return series.map((view) => {
    const latest = view.points
      .filter(isValidReading)
      .reduce<(TimeSeriesPoint & { value: number }) | undefined>(
        (found, point) =>
          found === undefined || point.timestamp > found.timestamp ? point : found,
        undefined,
      );
    return {
      seriesId: view.definition.id,
      latestValue: latest?.value ?? null,
      latestAt: latest?.timestamp,
      ageMs: latest ? Math.max(0, nowMs - latest.timestamp) : undefined,
      status: view.status,
      isSimulated: view.definition.isSimulated || isLiveSimulated,
    };
  });
}
