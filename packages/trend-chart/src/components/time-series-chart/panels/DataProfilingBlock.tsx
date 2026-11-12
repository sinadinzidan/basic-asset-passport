import { DATA_QUALITY_ISSUE_LABELS } from '../../../constants/timeSeriesChart';
import { DataQualityIssue } from '../../../enums/timeSeriesChart';
import { formatNumber } from '../../../lib/format';
import { formatDuration } from '../../../lib/monitoring/duration';
import { formatSignalWithUnit } from '../../../lib/monitoring/signalFormat';
import type { ChartSeriesView, DataProfile } from '../../../types/timeSeriesChart';

import { formatChartInstantShort } from './panelFormat';
import { SeriesLabel } from './SeriesLabel';

interface DataProfilingBlockProperties {
  series: ChartSeriesView;
  profile: DataProfile | undefined;
}

const VISIBLE_GAP_COUNT = 3;

type ProfileWarning = DataProfile['warnings'][number];

function repeatedCount(profile: DataProfile, issue: DataQualityIssue): number | undefined {
  switch (issue) {
    case DataQualityIssue.MISSING_VALUE:
      return profile.missingCount;
    case DataQualityIssue.INVALID_VALUE:
      return profile.invalidCount;
    case DataQualityIssue.BAD_QUALITY:
      return profile.badQualityCount;
    case DataQualityIssue.DUPLICATE_TIMESTAMP:
      return profile.duplicateTimestampCount;
    case DataQualityIssue.TIME_GAP:
      return profile.gaps.length;
    case DataQualityIssue.STALE:
      return undefined;
  }
}

/** A warning that only restates a count or the gaps already shown carries no news; one that says something else, such as stale data, does. */
function isNews(profile: DataProfile, warning: ProfileWarning): boolean {
  const count = repeatedCount(profile, warning.issue);
  return (
    count === undefined ||
    warning.message !== `${DATA_QUALITY_ISSUE_LABELS[warning.issue]}: ${count}`
  );
}

/** A warning always names its issue; a message that already starts with the name is shown as it is. */
function warningText(warning: ProfileWarning): string {
  const label = DATA_QUALITY_ISSUE_LABELS[warning.issue];
  return warning.message.startsWith(label) ? warning.message : `${label}: ${warning.message}`;
}

function InlineFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="tabular-nums text-xs font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="tabular-nums text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}

export function DataProfilingBlock({ series, profile }: DataProfilingBlockProperties) {
  return (
    <li className="flex flex-col gap-3 py-3 last:pb-0">
      <SeriesLabel series={series} />
      {profile ? (
        <ProfileFacts profile={profile} unit={series.unit} />
      ) : (
        <p className="text-xs text-muted-foreground">Not profiled yet</p>
      )}
    </li>
  );
}

function ProfileFacts({ profile, unit }: { profile: DataProfile; unit: string }) {
  const issueCounts = [
    { label: 'Missing', count: profile.missingCount },
    { label: 'Invalid', count: profile.invalidCount },
    { label: 'Flagged bad', count: profile.badQualityCount },
    { label: 'Duplicate timestamps', count: profile.duplicateTimestampCount },
  ].filter((entry) => entry.count > 0);
  const newsWarnings = profile.warnings.filter((warning) => isNews(profile, warning));
  const hiddenGapCount = Math.max(0, profile.gaps.length - VISIBLE_GAP_COUNT);
  const isClean =
    issueCounts.length === 0 && profile.gaps.length === 0 && newsWarnings.length === 0;
  return (
    <>
      <dl aria-label="Statistics of the range" className="grid grid-cols-3 gap-x-3">
        <Fact label="Minimum" value={formatSignalWithUnit(profile.statistics.min, unit)} />
        <Fact label="Maximum" value={formatSignalWithUnit(profile.statistics.max, unit)} />
        <Fact label="Mean" value={formatSignalWithUnit(profile.statistics.mean, unit)} />
      </dl>
      <dl aria-label="Reading counts" className="flex flex-wrap gap-x-3 gap-y-1">
        <InlineFact label="Valid" value={formatNumber(profile.validCount)} />
        {issueCounts.map((entry) => (
          <InlineFact key={entry.label} label={entry.label} value={formatNumber(entry.count)} />
        ))}
      </dl>
      {profile.gaps.length > 0 ? (
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">
            {DATA_QUALITY_ISSUE_LABELS[DataQualityIssue.TIME_GAP]}
          </p>
          <ul aria-label="Gaps" className="flex flex-col gap-1">
            {profile.gaps.slice(0, VISIBLE_GAP_COUNT).map((gap) => (
              <li
                key={`${gap.from}-${gap.to}`}
                className="tabular-nums flex items-baseline justify-between gap-3 text-xs text-foreground"
              >
                <span>
                  {formatChartInstantShort(gap.from)} to {formatChartInstantShort(gap.to)}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {formatDuration(gap.to - gap.from)}
                </span>
              </li>
            ))}
            {hiddenGapCount > 0 ? (
              <li className="text-xs text-muted-foreground">{hiddenGapCount} more</li>
            ) : null}
          </ul>
        </div>
      ) : null}
      {newsWarnings.length > 0 ? (
        <ul aria-label="Data quality warnings" className="flex flex-col gap-1">
          {newsWarnings.map((warning) => (
            <li
              key={`${warning.issue}-${warning.message}`}
              className="text-xs text-warning-foreground"
            >
              {warningText(warning)}
            </li>
          ))}
        </ul>
      ) : null}
      {isClean ? <p className="text-xs text-muted-foreground">No issues found</p> : null}
    </>
  );
}
