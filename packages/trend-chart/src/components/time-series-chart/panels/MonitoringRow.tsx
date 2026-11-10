import { CHART_STALE_AFTER_MS, SERIES_STATUS_LABELS, SERIES_STATUS_TONES } from '../../../constants/timeSeriesChart';
import { PillSize } from '../../../enums/display';
import { SeriesDataStatus } from '../../../enums/timeSeriesChart';
import { MISSING_VALUE } from '../../../lib/format';
import { formatDuration } from '../../../lib/monitoring/duration';
import { formatSignalWithUnit } from '../../../lib/monitoring/signalFormat';
import type { ChartSeriesView, MonitoringSnapshot } from '../../../types/timeSeriesChart';
import { StatusPill } from '../../general/StatusPill';

import { FACT_SEPARATOR, formatChartInstantShort } from './panelFormat';
import { SeriesLabel } from './SeriesLabel';

interface MonitoringRowProps {
  series: ChartSeriesView;
  snapshot: MonitoringSnapshot | undefined;
  nowMs: number;
}

function ageText(snapshot: MonitoringSnapshot, nowMs: number): string {
  const ageMs = snapshot.latestAt === undefined ? snapshot.ageMs : Math.max(0, nowMs - snapshot.latestAt);
  return ageMs === undefined ? MISSING_VALUE : `${formatDuration(ageMs)} ago`;
}

function readingText(snapshot: MonitoringSnapshot, nowMs: number): string | undefined {
  if (snapshot.latestAt === undefined) return undefined;
  const facts = [formatChartInstantShort(snapshot.latestAt), ageText(snapshot, nowMs)];
  if (snapshot.status === SeriesDataStatus.STALE) facts.push(`stale after ${formatDuration(CHART_STALE_AFTER_MS)}`);
  return facts.join(FACT_SEPARATOR);
}

/** The status says something only when it is not the usual OK; a series that failed to load, or has no value to show, says so whatever its snapshot reads. */
function noteworthyStatus(
  series: ChartSeriesView,
  snapshot: MonitoringSnapshot | undefined,
): SeriesDataStatus | undefined {
  if (series.status === SeriesDataStatus.ERROR) return SeriesDataStatus.ERROR;
  if (snapshot === undefined) return undefined;
  if (snapshot.status === SeriesDataStatus.OK)
    return snapshot.latestValue === null ? SeriesDataStatus.NO_DATA : undefined;
  return snapshot.status;
}

export function MonitoringRow({ series, snapshot, nowMs }: MonitoringRowProps) {
  const status = noteworthyStatus(series, snapshot);
  const reading = snapshot ? readingText(snapshot, nowMs) : undefined;
  return (
    <li className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
      <div className="flex items-center justify-between gap-2">
        <SeriesLabel series={series} />
        {status ? (
          <StatusPill label={SERIES_STATUS_LABELS[status]} tone={SERIES_STATUS_TONES[status]} size={PillSize.SMALL} />
        ) : null}
      </div>
      {snapshot ? (
        <>
          <p className="tabular-nums text-xl font-semibold text-foreground">
            {formatSignalWithUnit(snapshot.latestValue, series.unit)}
          </p>
          {reading ? <p className="tabular-nums text-xs text-muted-foreground">{reading}</p> : null}
        </>
      ) : (
        <p className="text-xs text-muted-foreground">No monitoring information for this series.</p>
      )}
      {series.status === SeriesDataStatus.ERROR ? (
        <p className="text-xs text-destructive-foreground">
          The series could not be loaded{series.errorMessage ? `: ${series.errorMessage}` : '.'}
        </p>
      ) : null}
    </li>
  );
}
