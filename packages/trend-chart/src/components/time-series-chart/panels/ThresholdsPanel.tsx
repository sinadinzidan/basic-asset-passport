import { useMemo } from 'react';

import { findBreaches } from '../../../lib/time-series-chart/thresholds';
import type { ChartSeriesView, ChartTimeRange } from '../../../types/timeSeriesChart';
import { SwitchField } from '../../general/forms/SwitchField';
import { StateMessage } from '../../general/StateMessage';

import { SeriesLabel } from './SeriesLabel';
import { ThresholdRow } from './ThresholdRow';

interface ThresholdsPanelProps {
  series: readonly ChartSeriesView[];
  showThresholds: boolean;
  onShowThresholdsChange: (show: boolean) => void;
  range: ChartTimeRange;
}

function hasMixedSources(series: ChartSeriesView): boolean {
  return new Set(series.thresholds.map((threshold) => threshold.source)).size > 1;
}

/**
 * The limits of each series: the level, side and value of every threshold, how many readings of the range lie beyond it and
 * when. Thresholds come from the data source or were configured; they are never worked out from the observed minimum and maximum.
 */
export function ThresholdsPanel({ series, showThresholds, onShowThresholdsChange, range }: ThresholdsPanelProps) {
  const breachesBySeries = useMemo(
    () =>
      new Map(
        series.map((entry) => [entry.configuration.seriesId, findBreaches(entry.points, entry.thresholds, range)]),
      ),
    [series, range],
  );
  const limitedSeries = series.filter((entry) => entry.thresholds.length > 0);
  const unlimitedNames = series.filter((entry) => entry.thresholds.length === 0).map((entry) => entry.definition.name);

  return (
    <>
      <SwitchField label="Show threshold lines" checked={showThresholds} onChange={onShowThresholdsChange} />
      {series.length === 0 ? (
        <StateMessage size="inline" title="No series selected" description="Add a series to see its thresholds." />
      ) : limitedSeries.length === 0 ? (
        <StateMessage
          size="inline"
          title="No thresholds to show"
          description="None of these series comes with an alert or danger limit."
        />
      ) : (
        <div className="flex flex-col gap-3">
          <ul
            aria-label="Thresholds by series"
            className="-mt-1 flex flex-col divide-y divide-border border-t border-border"
          >
            {limitedSeries.map((entry) => (
              <li key={entry.configuration.seriesId} className="flex flex-col gap-3 py-3">
                <SeriesLabel series={entry} />
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
                      breaches={(breachesBySeries.get(entry.configuration.seriesId) ?? []).filter(
                        (breach) => breach.threshold.id === threshold.id,
                      )}
                    />
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          {unlimitedNames.length > 0 ? (
            <p className="text-xs text-muted-foreground">No thresholds for {unlimitedNames.join(', ')}</p>
          ) : null}
        </div>
      )}
    </>
  );
}
