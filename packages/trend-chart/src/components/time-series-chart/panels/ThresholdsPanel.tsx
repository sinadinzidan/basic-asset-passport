import { useMemo } from 'react';

import { StateSize } from '../../../enums/stateSize';
import { findBreaches } from '../../../lib/time-series-chart/thresholds';
import type {
  ChartSeriesView,
  ChartTimeRange,
  ConfiguredThreshold,
} from '../../../types/timeSeriesChart';
import { SwitchField } from '../../general/forms/SwitchField';
import { StateMessage } from '../../general/StateMessage';

import { SeriesLabel } from './SeriesLabel';
import { ThresholdAddForm } from './ThresholdAddForm';
import { ThresholdRow } from './ThresholdRow';

interface ThresholdsPanelProperties {
  series: readonly ChartSeriesView[];
  shouldShowThresholds: boolean;
  onShowThresholdsChange: (show: boolean) => void;
  range: ChartTimeRange;
  /** Adds a threshold of the user's own and returns why it could not be added, if it could not. */
  onThresholdAdd: (threshold: ConfiguredThreshold) => string | undefined;
  onThresholdRemove: (thresholdId: string) => void;
}

function hasMixedSources(series: ChartSeriesView): boolean {
  return new Set(series.thresholds.map((threshold) => threshold.source)).size > 1;
}

/**
 * The limits of each series: the level, side and value of every threshold, how many readings of the range lie beyond it and
 * when. Thresholds come from the data source or were added by the user here; they are never worked out from the observed
 * minimum and maximum.
 */
export function ThresholdsPanel({
  series,
  shouldShowThresholds,
  onShowThresholdsChange,
  range,
  onThresholdAdd,
  onThresholdRemove,
}: ThresholdsPanelProperties) {
  const breachesBySeries = useMemo(
    () =>
      new Map(
        series.map((entry) => [
          entry.configuration.seriesId,
          findBreaches(entry.points, entry.thresholds, range),
        ]),
      ),
    [series, range],
  );
  return (
    <>
      <SwitchField
        label="Show threshold lines"
        checked={shouldShowThresholds}
        onChange={onShowThresholdsChange}
      />
      {series.length === 0 ? (
        <StateMessage
          size={StateSize.INLINE}
          title="No series selected"
          description="Add a series to see and set its thresholds."
        />
      ) : (
        <ul
          aria-label="Thresholds by series"
          className="-mt-1 flex flex-col divide-y divide-border border-t border-border"
        >
          {series.map((entry) => (
            <li key={entry.configuration.seriesId} className="flex flex-col gap-3 py-3">
              <SeriesLabel series={entry} />
              {entry.thresholds.length === 0 ? (
                <p className="text-xs text-muted-foreground">No thresholds for this series yet.</p>
              ) : (
                <ul
                  aria-label={`Thresholds of ${entry.definition.name}`}
                  className="flex flex-col divide-y divide-border/70"
                >
                  {entry.thresholds.map((threshold) => (
                    <ThresholdRow
                      key={threshold.id}
                      threshold={threshold}
                      series={entry}
                      range={range}
                      isSourceShown={hasMixedSources(entry)}
                      onRemove={onThresholdRemove}
                      breaches={(breachesBySeries.get(entry.configuration.seriesId) ?? []).filter(
                        (breach) => breach.threshold.id === threshold.id,
                      )}
                    />
                  ))}
                </ul>
              )}
              <ThresholdAddForm series={entry} onAdd={onThresholdAdd} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
