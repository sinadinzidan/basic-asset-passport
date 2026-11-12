import type { ReactNode } from 'react';

import { SERIES_STATUS_LABELS, SERIES_STATUS_TONES } from '../../../constants/timeSeriesChart';
import { PillSize } from '../../../enums/display';
import { SeriesDataStatus } from '../../../enums/timeSeriesChart';
import { isValidReading } from '../../../lib/time-series-chart/statistics';
import type { ChartSeriesView, DataProfile, TimeSeriesPoint } from '../../../types/timeSeriesChart';
import { StatusPill } from '../../general/StatusPill';
import { MetadataText } from '../series/MetadataText';

import { formatChartInstant } from './panelFormat';
import { PanelSection } from './PanelSection';
import { SeriesLabel } from './SeriesLabel';

interface SeriesInfoPanelProperties {
  series: ChartSeriesView;
  profile: DataProfile | undefined;
}

interface Fact {
  label: string;
  value: ReactNode;
}

const RANGE_SEPARATOR = ' to ';

function readingRangeText(points: readonly TimeSeriesPoint[]): string | undefined {
  const timestamps = points.filter(isValidReading).map((point) => point.timestamp);
  if (timestamps.length === 0) return undefined;
  return `${formatChartInstant(Math.min(...timestamps))}${RANGE_SEPARATOR}${formatChartInstant(Math.max(...timestamps))}`;
}

function profileSummary(profile: DataProfile): string {
  const parts = [
    `${profile.validCount} valid ${profile.validCount === 1 ? 'reading' : 'readings'}`,
    ...[
      { count: profile.missingCount, text: 'missing' },
      { count: profile.invalidCount, text: 'invalid' },
      { count: profile.badQualityCount, text: 'flagged as bad quality' },
      { count: profile.duplicateTimestampCount, text: 'with a duplicate timestamp' },
    ]
      .filter((entry) => entry.count > 0)
      .map((entry) => `${entry.count} ${entry.text}`),
  ];
  return `${parts.join(', ')} in the visible range.`;
}

function FactList({ label, facts }: { label: string; facts: readonly Fact[] }) {
  return (
    <dl aria-label={label} className="flex flex-col divide-y divide-border">
      {facts.map((fact) => (
        <div
          key={fact.label}
          className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-3 py-1.5 first:pt-0 last:pb-0"
        >
          <dt className="text-xs text-muted-foreground">{fact.label}</dt>
          <dd className="break-words text-sm text-foreground">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function DataQuality({ profile }: { profile: DataProfile | undefined }) {
  if (!profile)
    return <p className="text-xs text-muted-foreground">Not profiled yet for the visible range.</p>;
  return (
    <div className="flex flex-col gap-1.5">
      <p className="tabular-nums text-sm text-foreground">{profileSummary(profile)}</p>
      {profile.warnings.length > 0 ? (
        <ul className="flex list-disc flex-col gap-1 pl-4 text-sm text-muted-foreground">
          {profile.warnings.map((warning) => (
            <li key={`${warning.issue}-${warning.message}`}>{warning.message}</li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">No data quality issues found.</p>
      )}
    </div>
  );
}

/**
 * Everything the chart knows about one series, as the body of a sidebar panel. What the data source does not supply reads
 * "Not available". The status of the source is a pill only when it is not the normal one, and the chart header says once that the
 * data is simulated.
 */
export function SeriesInfoPanel({ series, profile }: SeriesInfoPanelProperties) {
  const { definition } = series;
  const shouldShowOtherUnit = series.unit !== '' && series.unit !== definition.unit;
  const identification: Fact[] = [
    { label: 'External ID', value: <MetadataText value={definition.name} /> },
    { label: 'Tag', value: <MetadataText value={definition.tag} /> },
    { label: 'Description', value: <MetadataText value={definition.description} /> },
    {
      label: 'Belongs to',
      value: <MetadataText value={definition.parentName ?? definition.parentId} />,
    },
  ];
  const data: Fact[] = [
    { label: 'Unit', value: <MetadataText value={definition.unit} /> },
    ...(shouldShowOtherUnit ? [{ label: 'Shown in', value: series.unit }] : []),
    { label: 'Data type', value: <MetadataText value={definition.dataType} /> },
    { label: 'Source', value: <MetadataText value={definition.sourceName} /> },
    ...(series.status === SeriesDataStatus.OK
      ? []
      : [
          {
            label: 'Source status',
            value: (
              <StatusPill
                label={SERIES_STATUS_LABELS[series.status]}
                tone={SERIES_STATUS_TONES[series.status]}
                size={PillSize.SMALL}
              />
            ),
          },
        ]),
    {
      label: 'Available data range',
      value: (
        <span className="tabular-nums">
          <MetadataText value={readingRangeText(series.points)} />
        </span>
      ),
    },
    { label: 'Sampling', value: <MetadataText value={definition.sampling} /> },
  ];
  return (
    <>
      <SeriesLabel series={series} />
      <PanelSection title="Identification">
        <FactList label="Identification" facts={identification} />
      </PanelSection>
      <PanelSection title="Data">
        <FactList label="Data" facts={data} />
      </PanelSection>
      <PanelSection title="Data quality">
        <DataQuality profile={profile} />
      </PanelSection>
    </>
  );
}
