import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MILLISECONDS_PER_MINUTE } from '../../../../constants/monitoring';
import { AlertSeverity, AlertStatus } from '../../../../enums/timeSeriesChart';
import { setChartTimeZone } from '../../../../lib/timeZone';
import { createDefinition, createSeriesView } from '../../../../mocks/chartData';
import type { ChartAlert } from '../../../../types/timeSeriesChart';
import { AlertingPanel } from '../AlertingPanel';

const MINUTE_MS = MILLISECONDS_PER_MINUTE;
const NOW_MS = Date.UTC(2026, 9, 1, 8, 0);
const OLDEST = alert({ id: 'a1', at: NOW_MS - 30 * MINUTE_MS, message: 'Pressure rising' });
const MIDDLE = alert({
  id: 'a2',
  at: NOW_MS - 20 * MINUTE_MS,
  message: 'Pressure above the danger limit',
  severity: AlertSeverity.DANGER,
});
const NEWEST = alert({
  id: 'a3',
  at: NOW_MS - 10 * MINUTE_MS,
  message: 'Pressure back to normal',
  severity: AlertSeverity.DANGER,
  status: AlertStatus.CLEARED,
});
const ALERTS = [OLDEST, NEWEST, MIDDLE];

// The host app may have set its own zone; these tests start from the chart's default.
beforeEach(() => setChartTimeZone({ id: 'UTC', label: 'UTC' }));
afterEach(() => setChartTimeZone({ id: 'UTC', label: 'UTC' }));

describe(AlertingPanel.name, () => {
  it('lists the alerts, the newest first', () => {
    renderPanel();

    expect(alertRows().map((row) => row.textContent)).toEqual([
      expect.stringContaining('Pressure back to normal'),
      expect.stringContaining('Pressure above the danger limit'),
      expect.stringContaining('Pressure rising'),
    ]);
  });

  it('leaves out an alert of a series that is not on the chart', () => {
    renderPanel({
      alerts: [...ALERTS, alert({ id: 'a4', seriesId: 'elsewhere', message: 'Not ours' })],
    });

    expect(alertRows()).toHaveLength(3);
    expect(screen.queryByText('Not ours')).not.toBeInTheDocument();
  });

  it('does not name the series while there is only one', () => {
    renderPanel();

    expect(
      within(screen.getByRole('list', { name: 'Alerts' })).queryByText('Discharge pressure'),
    ).toBeNull();
  });

  it('names the series of each alert when there are several', () => {
    const flow = createSeriesView({ definition: createDefinition({ id: 's2', name: 'Flow' }) });

    renderPanel({
      series: [createSeriesView(), flow],
      alerts: [OLDEST, alert({ id: 'a5', seriesId: 's2' })],
    });

    const list = within(screen.getByRole('list', { name: 'Alerts' }));
    expect(list.getByText('Discharge pressure')).toBeInTheDocument();
    expect(list.getByText('Flow')).toBeInTheDocument();
  });

  it('hands the chosen alert to the chart', async () => {
    const onSelectAlert = vi.fn();
    renderPanel({ onSelectAlert });

    await userEvent.click(screen.getByRole('button', { name: /Pressure rising/ }));

    expect(onSelectAlert).toHaveBeenCalledWith(OLDEST);
  });

  it('counts the alerts behind each choice of a filter', async () => {
    renderPanel();

    expect(screen.getByRole('combobox', { name: 'Severity' })).toHaveTextContent('All (3)');
    await userEvent.click(screen.getByRole('combobox', { name: 'Severity' }));

    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'All (3)',
      'Danger (2)',
      'Alert (1)',
    ]);
  });

  it('shows only the alerts of the chosen severity', async () => {
    renderPanel();

    await chooseFilter('Severity', 'Alert (1)');

    expect(alertRows()).toHaveLength(1);
    expect(alertRows()[0]).toHaveTextContent('Pressure rising');
  });

  it('shows only the alerts of the chosen status', async () => {
    renderPanel();

    await chooseFilter('Status', 'Cleared (1)');

    expect(alertRows()).toHaveLength(1);
    expect(alertRows()[0]).toHaveTextContent('Pressure back to normal');
  });

  it('counts the choices of one filter within what the other one shows', async () => {
    renderPanel();

    await chooseFilter('Severity', 'Danger (2)');
    await userEvent.click(screen.getByRole('combobox', { name: 'Status' }));

    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'All (2)',
      'Active (1)',
      'Acknowledged (0)',
      'Cleared (1)',
    ]);
  });

  it('says so when no alert matches the filters, and shows them all again once the filters are cleared', async () => {
    renderPanel();
    await chooseFilter('Severity', 'Alert (1)');
    await chooseFilter('Status', 'Cleared (0)');
    expect(screen.getByText('No alerts match these filters')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(alertRows()).toHaveLength(3);
  });

  it('shows loading rows while the alerts load', () => {
    renderPanel({ isLoading: true, alerts: [] });

    expect(screen.getByRole('status', { name: 'Loading' }).children).toHaveLength(3);
  });

  it('shows a failure and offers to try again', async () => {
    const onRetry = vi.fn();
    renderPanel({ error: new Error('Alerts are unavailable'), onRetry });

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Alerts are unavailable');
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('says so when no series is on the chart', () => {
    renderPanel({ series: [], alerts: [] });

    expect(screen.getByText('No series selected')).toBeInTheDocument();
    expect(screen.getByText('Add a series to see its alerts.')).toBeInTheDocument();
  });

  it('says so, without filters, when the series have no alerts in the range', () => {
    renderPanel({ alerts: [] });

    expect(screen.getByText('No alerts for these series in this range')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});

function alert(overrides: Partial<ChartAlert> = {}): ChartAlert {
  return {
    id: 'a1',
    seriesId: 's1',
    severity: AlertSeverity.ALERT,
    status: AlertStatus.ACTIVE,
    at: Date.UTC(2026, 9, 1, 7, 30),
    message: 'Pressure rising',
    ...overrides,
  };
}

function renderPanel(overrides: Partial<Parameters<typeof AlertingPanel>[0]> = {}) {
  return render(
    <AlertingPanel
      series={[createSeriesView()]}
      alerts={ALERTS}
      isLoading={false}
      error={undefined}
      onRetry={vi.fn()}
      onSelectAlert={vi.fn()}
      {...overrides}
    />,
  );
}

function alertRows(): HTMLElement[] {
  return within(screen.getByRole('list', { name: 'Alerts' })).getAllByRole('listitem');
}

async function chooseFilter(label: string, option: string): Promise<void> {
  await userEvent.click(screen.getByRole('combobox', { name: label }));
  await userEvent.click(screen.getByRole('option', { name: option }));
}
