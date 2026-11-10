import { useMemo } from 'react';

import type { ChartSeriesView, DataProfile } from '../../../types/timeSeriesChart';
import { StateMessage } from '../../general/StateMessage';

import { DataProfilingBlock } from './DataProfilingBlock';

interface DataProfilingPanelProps {
  series: readonly ChartSeriesView[];
  profiles: readonly DataProfile[];
  rangeLabel: string;
}

export function DataProfilingPanel({ series, profiles, rangeLabel }: DataProfilingPanelProps) {
  const profilesBySeries = useMemo(() => new Map(profiles.map((profile) => [profile.seriesId, profile])), [profiles]);

  if (series.length === 0)
    return (
      <StateMessage size="inline" title="No series selected" description="Add a series to profile its readings." />
    );
  return (
    <>
      <p className="text-xs text-muted-foreground">Profiled over {rangeLabel}</p>
      <ul aria-label="Profile by series" className="-mt-1 flex flex-col divide-y divide-border border-t border-border">
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
