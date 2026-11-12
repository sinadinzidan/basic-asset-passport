import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MILLISECONDS_PER_MINUTE } from '../../../../constants/monitoring';
import { SeriesDataStatus } from '../../../../enums/timeSeriesChart';
import { setChartTimeZone } from '../../../../lib/timeZone';
import { createDefinition, createSeriesView } from '../../../../mocks/chartData';
import type { MonitoringSnapshot } from '../../../../types/timeSeriesChart';
import { MonitoringPanel } from '../MonitoringPanel';
import { MonitoringRow } from '../MonitoringRow';

const MINUTE_MS = MILLISECONDS_PER_MINUTE;
const NOW_MS = Date.UTC(2026, 9, 1, 8, 0);

// The host app may have set its own zone; these tests start from the chart's default.
beforeEach(() => setChartTimeZone({ id: 'UTC', label: 'UTC' }));
afterEach(() => setChartTimeZone({ id: 'UTC', label: 'UTC' }));

describe(MonitoringPanel.name, () => {
  it('lists the latest reading of each series', () => {
    const flow = createSeriesView({
      definition: createDefinition({ id: 's2', name: 'Flow', unit: 'm³/h' }),
    });
    renderPanel({
      series: [createSeriesView(), flow],
      snapshots: [snapshot(), snapshot({ seriesId: 's2', latestValue: 120 })],
    });

    const rows = within(screen.getByRole('list', { name: 'Monitored series' })).getAllByRole(
      'listitem',
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('Discharge pressure');
    expect(rows[0]).toHaveTextContent('8.00 bar');
    expect(rows[1]).toHaveTextContent('Flow');
    expect(rows[1]).toHaveTextContent('120.0 m³/h');
  });

  it('says so for a series it has no snapshot of', () => {
    renderPanel({ snapshots: [] });

    expect(screen.getByText('No monitoring information for this series.')).toBeInTheDocument();
  });

  it('shows loading rows while the readings load', () => {
    renderPanel({ isLoading: true });

    expect(screen.getByRole('status', { name: 'Loading' }).children).toHaveLength(3);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('shows a failure and offers to try again', async () => {
    const onRetry = vi.fn();
    renderPanel({ error: new Error('The source is down'), onRetry });

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByRole('alert')).toHaveTextContent('The source is down');
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('says so when no series is on the chart', () => {
    renderPanel({ series: [], snapshots: [] });

    expect(screen.getByText('No series selected')).toBeInTheDocument();
    expect(screen.getByText('Add a series to see its latest reading.')).toBeInTheDocument();
  });
});

describe(MonitoringRow.name, () => {
  it('shows the latest value in the unit of the series', () => {
    renderRow();

    expect(screen.getByText('8.00 bar')).toBeInTheDocument();
  });

  it('says when the value was read and how long ago', () => {
    renderRow({ snapshot: snapshot({ latestAt: NOW_MS - 5 * MINUTE_MS }) });

    expect(screen.getByText('1 Oct, 07:55 · 5 min ago')).toBeInTheDocument();
  });

  it('counts the age from now, not from when the snapshot was taken', () => {
    renderRow({
      snapshot: snapshot({ latestAt: NOW_MS - 5 * MINUTE_MS, ageMs: 0 }),
      nowMs: NOW_MS + 10 * MINUTE_MS,
    });

    expect(screen.getByText('1 Oct, 07:55 · 15 min ago')).toBeInTheDocument();
  });

  it('says nothing about a status that is as usual', () => {
    renderRow();

    expect(screen.queryByText('Data')).not.toBeInTheDocument();
  });

  it('marks a stale series and says after how long a reading is stale', () => {
    renderRow({
      snapshot: snapshot({ status: SeriesDataStatus.STALE, latestAt: NOW_MS - 45 * MINUTE_MS }),
    });

    expect(screen.getByText('Stale')).toBeInTheDocument();
    expect(screen.getByText('1 Oct, 07:15 · 45 min ago · stale after 30 min')).toBeInTheDocument();
  });

  it('marks a series without a value as having no data, never as zero', () => {
    renderRow({ snapshot: snapshot({ latestValue: null, latestAt: undefined, ageMs: undefined }) });

    expect(screen.getByText('No data')).toBeInTheDocument();
    expect(screen.getByText('---')).toBeInTheDocument();
  });

  it('shows no reading time for a series that was never read', () => {
    renderRow({ snapshot: snapshot({ latestValue: null, latestAt: undefined, ageMs: undefined }) });

    expect(screen.queryByText(/ago/)).not.toBeInTheDocument();
  });

  it('marks a series that is still loading', () => {
    renderRow({ snapshot: snapshot({ status: SeriesDataStatus.LOADING }) });

    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  it('says that a series failed to load, with the reason', () => {
    const failed = createSeriesView({
      status: SeriesDataStatus.ERROR,
      errorMessage: 'The source is down',
    });

    renderRow({ series: failed });

    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(
      screen.getByText('The series could not be loaded: The source is down'),
    ).toBeInTheDocument();
  });

  it('says that a series failed to load when no reason is known', () => {
    renderRow({
      series: createSeriesView({ status: SeriesDataStatus.ERROR }),
      snapshot: undefined,
    });

    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('The series could not be loaded.')).toBeInTheDocument();
  });

  it('says so when there is no snapshot of the series', () => {
    renderRow({ snapshot: undefined });

    expect(screen.getByText('No monitoring information for this series.')).toBeInTheDocument();
  });
});

function snapshot(overrides: Partial<MonitoringSnapshot> = {}): MonitoringSnapshot {
  return {
    seriesId: 's1',
    latestValue: 8,
    latestAt: NOW_MS,
    ageMs: 0,
    status: SeriesDataStatus.OK,
    isSimulated: false,
    ...overrides,
  };
}

function renderPanel(overrides: Partial<Parameters<typeof MonitoringPanel>[0]> = {}) {
  return render(
    <MonitoringPanel
      series={[createSeriesView()]}
      snapshots={[snapshot()]}
      isLoading={false}
      error={undefined}
      onRetry={vi.fn()}
      nowMs={NOW_MS}
      {...overrides}
    />,
  );
}

function renderRow(overrides: Partial<Parameters<typeof MonitoringRow>[0]> = {}) {
  return render(
    <ul>
      <MonitoringRow
        series={createSeriesView()}
        snapshot={snapshot()}
        nowMs={NOW_MS}
        {...overrides}
      />
    </ul>,
  );
}
