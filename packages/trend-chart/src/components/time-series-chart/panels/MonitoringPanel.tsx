import { useMemo } from 'react';

import { StateSize } from '../../../enums/stateSize';
import type { ChartSeriesView, MonitoringSnapshot } from '../../../types/timeSeriesChart';
import { ErrorState, LoadingRows } from '../../general/QueryState';
import { StateMessage } from '../../general/StateMessage';

import { MonitoringRow } from './MonitoringRow';

interface MonitoringPanelProperties {
  series: readonly ChartSeriesView[];
  snapshots: readonly MonitoringSnapshot[];
  isLoading: boolean;
  error: Error | undefined;
  onRetry: () => void;
  nowMs: number;
}

/**
 * The latest value of each series, when it was read, how old it is and whether it is stale or missing. Whether the values are
 * simulated is said once by the chart header, not on every row.
 */
export function MonitoringPanel({
  series,
  snapshots,
  isLoading,
  error,
  onRetry,
  nowMs,
}: MonitoringPanelProperties) {
  const snapshotsBySeries = useMemo(
    () => new Map(snapshots.map((snapshot) => [snapshot.seriesId, snapshot])),
    [snapshots],
  );

  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (isLoading) return <LoadingRows rows={3} />;
  if (series.length === 0)
    return (
      <StateMessage
        size={StateSize.INLINE}
        title="No series selected"
        description="Add a series to see its latest reading."
      />
    );

  return (
    <ul aria-label="Monitored series" className="flex flex-col divide-y divide-border">
      {series.map((entry) => (
        <MonitoringRow
          key={entry.configuration.seriesId}
          series={entry}
          snapshot={snapshotsBySeries.get(entry.configuration.seriesId)}
          nowMs={nowMs}
        />
      ))}
    </ul>
  );
}
