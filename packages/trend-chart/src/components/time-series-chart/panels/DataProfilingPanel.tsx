import { useMemo } from 'react';

import { StateSize } from '../../../enums/stateSize';
import type { ChartSeriesView, DataProfile } from '../../../types/timeSeriesChart';
import { StateMessage } from '../../general/StateMessage';

import { DataProfilingBlock } from './DataProfilingBlock';

interface DataProfilingPanelProperties {
  series: readonly ChartSeriesView[];
  profiles: readonly DataProfile[];
  rangeLabel: string;
}

export function DataProfilingPanel({ series, profiles, rangeLabel }: DataProfilingPanelProperties) {
  const profilesBySeries = useMemo(
    () => new Map(profiles.map((profile) => [profile.seriesId, profile])),
    [profiles],
  );

  if (series.length === 0)
    return (
      <StateMessage
        size={StateSize.INLINE}
        title="No series selected"
        description="Add a series to profile its readings."
      />
    );
  return (
    <>
      <p className="text-xs text-muted-foreground">Profiled over {rangeLabel}</p>
      <ul
        aria-label="Profile by series"
        className="-mt-1 flex flex-col divide-y divide-border border-t border-border"
      >
        {series.map((entry) => (
          <DataProfilingBlock
            key={entry.configuration.seriesId}
            series={entry}
            profile={profilesBySeries.get(entry.configuration.seriesId)}
          />
        ))}
      </ul>
    </>
  );
}
