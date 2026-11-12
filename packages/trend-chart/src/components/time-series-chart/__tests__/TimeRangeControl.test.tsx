import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MILLISECONDS_PER_DAY, MILLISECONDS_PER_HOUR } from '../../../constants/formats';
import { ChartRange } from '../../../enums/monitoring';
import { setChartTimeZone } from '../../../lib/timeZone';
import { TimeRangeControl } from '../TimeRangeControl';

const NOW_MS = Date.UTC(2026, 9, 1, 8, 0);
const LAST_HOUR = { start: NOW_MS - MILLISECONDS_PER_HOUR, end: NOW_MS };

// The host app may have set its own zone; these tests start from the chart's default.
beforeEach(() => setChartTimeZone({ id: 'UTC', label: 'UTC' }));
afterEach(() => setChartTimeZone({ id: 'UTC', label: 'UTC' }));

describe(TimeRangeControl.name, () => {
  it('says which time zone the range is in', () => {
    renderControl();

    expect(screen.getByRole('group', { name: 'Time range (UTC)' })).toBeInTheDocument();
  });

  it('shows the start and the end of the window', () => {
    renderControl();

    expect(screen.getByText('01 Oct 2026 07:00')).toBeInTheDocument();
    expect(screen.getByText('01 Oct 2026 08:00')).toBeInTheDocument();
  });

  it('shows the window on the clock of the chart zone', () => {
    setChartTimeZone({ id: 'Asia/Dubai', label: 'GST' });

    renderControl();

    expect(screen.getByRole('group', { name: 'Time range (GST)' })).toBeInTheDocument();
    expect(screen.getByText('01 Oct 2026 11:00')).toBeInTheDocument();
    expect(screen.getByText('01 Oct 2026 12:00')).toBeInTheDocument();
  });

  it('offers today and every preset as a shortcut', async () => {
    renderControl();

    await userEvent.click(screen.getByRole('combobox', { name: 'Date picker' }));

    for (const label of ['Today', 'Last 15 minutes', 'Last 7 days', 'Last 3 months', 'All history'])
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
  });

  it('marks the shortcut the window stands for', async () => {
    renderControl();

    await userEvent.click(screen.getByRole('combobox', { name: 'Date picker' }));

    expect(screen.getByRole('button', { name: 'Last hour' })).toHaveAttribute('data-active');
    expect(screen.getByRole('button', { name: 'Last 6 hours' })).not.toHaveAttribute('data-active');
  });

  it('reports a range that follows now for a shortcut that stands for one', async () => {
    const { onRangeChange, onWindowChange } = renderControl();

    await userEvent.click(screen.getByRole('combobox', { name: 'Date picker' }));
    await userEvent.click(screen.getByRole('button', { name: 'Last 6 hours' }));

    expect(onRangeChange).toHaveBeenCalledWith(ChartRange.SIX_HOURS);
    expect(onWindowChange).not.toHaveBeenCalled();
  });

  it('reports a window that stays put for a shortcut without a range', async () => {
    const { onRangeChange, onWindowChange } = renderControl();

    await userEvent.click(screen.getByRole('combobox', { name: 'Date picker' }));
    await userEvent.click(screen.getByRole('button', { name: 'Last 2 days' }));

    expect(onWindowChange).toHaveBeenCalledWith({
      start: NOW_MS - 2 * MILLISECONDS_PER_DAY,
      end: NOW_MS,
    });
    expect(onRangeChange).not.toHaveBeenCalled();
  });

  it('reports today as the window from midnight in the chart zone to now', async () => {
    const { onWindowChange } = renderControl();

    await userEvent.click(screen.getByRole('combobox', { name: 'Date picker' }));
    await userEvent.click(screen.getByRole('button', { name: 'Today' }));

    expect(onWindowChange).toHaveBeenCalledWith({ start: Date.UTC(2026, 9, 1), end: NOW_MS });
  });
});

function renderControl() {
  const onRangeChange = vi.fn();
  const onWindowChange = vi.fn();
  render(
    <TimeRangeControl
      window={LAST_HOUR}
      nowMs={NOW_MS}
      onRangeChange={onRangeChange}
      onWindowChange={onWindowChange}
    />,
  );
  return { onRangeChange, onWindowChange };
}
