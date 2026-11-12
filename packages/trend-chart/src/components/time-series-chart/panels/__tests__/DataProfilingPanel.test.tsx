import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { MILLISECONDS_PER_MINUTE } from '../../../../constants/monitoring';
import { DataQualityIssue } from '../../../../enums/timeSeriesChart';
import { setChartTimeZone } from '../../../../lib/timeZone';
import { createDefinition, createSeriesView } from '../../../../mocks/chartData';
import type { DataProfile } from '../../../../types/timeSeriesChart';
import { DataProfilingBlock } from '../DataProfilingBlock';
import { DataProfilingPanel } from '../DataProfilingPanel';

const MINUTE_MS = MILLISECONDS_PER_MINUTE;
const NOW_MS = Date.UTC(2026, 9, 1, 8, 0);

// The host app may have set its own zone; these tests start from the chart's default.
beforeEach(() => setChartTimeZone({ id: 'UTC', label: 'UTC' }));
afterEach(() => setChartTimeZone({ id: 'UTC', label: 'UTC' }));

describe(DataProfilingPanel.name, () => {
  it('says what range the profile is over', () => {
    renderPanel({ rangeLabel: 'the last hour' });

    expect(screen.getByText('Profiled over the last hour')).toBeInTheDocument();
  });

  it('profiles each series on the chart', () => {
    const flow = createSeriesView({ definition: createDefinition({ id: 's2', name: 'Flow' }) });

    renderPanel({
      series: [createSeriesView(), flow],
      profiles: [profile(), profile({ seriesId: 's2' })],
    });

    const blocks = within(screen.getByRole('list', { name: 'Profile by series' })).getAllByRole(
      'listitem',
    );
    expect(blocks.map((block) => block.firstElementChild?.textContent)).toEqual([
      'Discharge pressure',
      'Flow',
    ]);
  });

  it('says so for a series that is not profiled yet', () => {
    renderPanel({ profiles: [] });

    expect(screen.getByText('Not profiled yet')).toBeInTheDocument();
  });

  it('says so when no series is on the chart', () => {
    renderPanel({ series: [], profiles: [] });

    expect(screen.getByText('No series selected')).toBeInTheDocument();
    expect(screen.getByText('Add a series to profile its readings.')).toBeInTheDocument();
  });
});

describe(DataProfilingBlock.name, () => {
  it('shows the lowest, the highest and the mean reading in the unit of the series', () => {
    renderBlock();

    const statistics = within(screen.getByLabelText('Statistics of the range'));
    expect(statistics.getByText('Minimum').nextElementSibling).toHaveTextContent('4.00 bar');
    expect(statistics.getByText('Maximum').nextElementSibling).toHaveTextContent('8.00 bar');
    expect(statistics.getByText('Mean').nextElementSibling).toHaveTextContent('6.00 bar');
  });

  it('shows statistics that cannot be worked out as missing, never as zero', () => {
    renderBlock(
      profile({ validCount: 0, statistics: { min: null, max: null, mean: null, count: 0 } }),
    );

    expect(
      within(screen.getByLabelText('Statistics of the range')).getAllByText('---'),
    ).toHaveLength(3);
  });

  it('counts the valid readings and says nothing of what did not happen', () => {
    renderBlock(profile({ validCount: 1234 }));

    const counts = screen.getByLabelText('Reading counts');
    expect(within(counts).getByText('Valid').nextElementSibling).toHaveTextContent('1,234');
    expect(counts.querySelectorAll('dt')).toHaveLength(1);
  });

  it('says that nothing is wrong with a clean series', () => {
    renderBlock();

    expect(screen.getByText('No issues found')).toBeInTheDocument();
  });

  it('counts each kind of unusable reading that occurred', () => {
    renderBlock(
      profile({ missingCount: 2, invalidCount: 1, badQualityCount: 4, duplicateTimestampCount: 3 }),
    );

    const counts = within(screen.getByLabelText('Reading counts'));
    expect(counts.getByText('Missing').nextElementSibling).toHaveTextContent('2');
    expect(counts.getByText('Invalid').nextElementSibling).toHaveTextContent('1');
    expect(counts.getByText('Flagged bad').nextElementSibling).toHaveTextContent('4');
    expect(counts.getByText('Duplicate timestamps').nextElementSibling).toHaveTextContent('3');
    expect(screen.queryByText('No issues found')).not.toBeInTheDocument();
  });

  it('lists when each gap was and how long it lasted', () => {
    renderBlock(
      profile({ gaps: [{ from: NOW_MS - 60 * MINUTE_MS, to: NOW_MS - 30 * MINUTE_MS }] }),
    );

    const gaps = within(screen.getByRole('list', { name: 'Gaps' }));
    expect(gaps.getByText('1 Oct, 07:00 to 1 Oct, 07:30')).toBeInTheDocument();
    expect(gaps.getByText('30 min')).toBeInTheDocument();
    expect(screen.getByText('Gaps in time')).toBeInTheDocument();
  });

  it('lists the first three gaps and counts the rest', () => {
    const gaps = [0, 1, 2, 3, 4].map((index) => ({
      from: NOW_MS + index * 60 * MINUTE_MS,
      to: NOW_MS + index * 60 * MINUTE_MS + 20 * MINUTE_MS,
    }));

    renderBlock(profile({ gaps }));

    const items = within(screen.getByRole('list', { name: 'Gaps' })).getAllByRole('listitem');
    expect(items).toHaveLength(4);
    expect(items[3]).toHaveTextContent('2 more');
  });

  it('leaves out a warning that only repeats a count already shown', () => {
    renderBlock(
      profile({
        missingCount: 2,
        warnings: [{ issue: DataQualityIssue.MISSING_VALUE, message: 'Missing readings: 2' }],
      }),
    );

    expect(screen.queryByRole('list', { name: 'Data quality warnings' })).not.toBeInTheDocument();
  });

  it('shows a warning that says something new, named by its issue', () => {
    renderBlock(
      profile({
        isStale: true,
        warnings: [
          {
            issue: DataQualityIssue.STALE,
            message: 'The latest valid reading is older than the freshness limit.',
          },
        ],
      }),
    );

    const warnings = within(screen.getByRole('list', { name: 'Data quality warnings' }));
    expect(
      warnings.getByText('Stale data: The latest valid reading is older than the freshness limit.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('No issues found')).not.toBeInTheDocument();
  });

  it('shows a warning that already names its issue as it is', () => {
    renderBlock(
      profile({
        warnings: [
          {
            issue: DataQualityIssue.MISSING_VALUE,
            message: 'Missing readings: too few to profile',
          },
        ],
      }),
    );

    expect(screen.getByText('Missing readings: too few to profile')).toBeInTheDocument();
  });

  it('says so when the series is not profiled yet', () => {
    renderBlock(null);

    expect(screen.getByText('Not profiled yet')).toBeInTheDocument();
    expect(screen.queryByLabelText('Statistics of the range')).not.toBeInTheDocument();
  });
});

/** The profile of a clean series of three readings: 4, 6 and 8. */
function profile(overrides: Partial<DataProfile> = {}): DataProfile {
  return {
    seriesId: 's1',
    validCount: 3,
    missingCount: 0,
    invalidCount: 0,
    badQualityCount: 0,
    duplicateTimestampCount: 0,
    gaps: [],
    latestAt: NOW_MS,
    isStale: false,
    statistics: { min: 4, max: 8, mean: 6, count: 3 },
    warnings: [],
    ...overrides,
  };
}

function renderPanel(overrides: Partial<Parameters<typeof DataProfilingPanel>[0]> = {}) {
  return render(
    <DataProfilingPanel
      series={[createSeriesView()]}
      profiles={[profile()]}
      rangeLabel="the last hour"
      {...overrides}
    />,
  );
}

/** Pass null for a series that has no profile. */
function renderBlock(seriesProfile: DataProfile | null = profile()) {
  return render(
    <ul>
      <DataProfilingBlock series={createSeriesView()} profile={seriesProfile ?? undefined} />
    </ul>,
  );
}
