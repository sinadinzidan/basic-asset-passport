import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MILLISECONDS_PER_MINUTE } from '../../../../constants/monitoring';
import { ThresholdLevel, ThresholdSide, ThresholdSource } from '../../../../enums/timeSeriesChart';
import {
  createDefinition,
  createPoints,
  createSeriesView,
  createThreshold,
} from '../../../../mocks/chartData';
import { ThresholdRow } from '../ThresholdRow';
import { ThresholdsPanel } from '../ThresholdsPanel';

const MINUTE_MS = MILLISECONDS_PER_MINUTE;
const TEN_MINUTES = { start: 0, end: 10 * MINUTE_MS };
/** Two readings in a row above 8, then back below. */
const READINGS = createPoints([1, 9, 10, 3]);

describe(ThresholdsPanel.name, () => {
  it('shows whether the threshold lines are drawn', () => {
    renderPanel({ shouldShowThresholds: true });

    expect(screen.getByRole('switch', { name: 'Show threshold lines' })).toBeChecked();
  });

  it('hides the threshold lines with the switch', async () => {
    const onShowThresholdsChange = vi.fn();
    renderPanel({ shouldShowThresholds: true, onShowThresholdsChange });

    await userEvent.click(screen.getByRole('switch', { name: 'Show threshold lines' }));

    expect(onShowThresholdsChange).toHaveBeenCalledWith(false);
  });

  it('says so when no series is on the chart', () => {
    renderPanel({ series: [] });

    expect(screen.getByText('No series selected')).toBeInTheDocument();
  });

  it('says so when no series comes with a limit', () => {
    renderPanel({ series: [createSeriesView({ points: READINGS })] });

    expect(screen.getByText('No thresholds to show')).toBeInTheDocument();
    expect(
      screen.getByText('None of these series comes with an alert or danger limit.'),
    ).toBeInTheDocument();
  });

  it('lists the thresholds of each series that has any', () => {
    renderPanel();

    const thresholds = screen.getByRole('list', { name: 'Thresholds of Discharge pressure' });
    expect(within(thresholds).getAllByRole('listitem')).toHaveLength(2);
    expect(within(thresholds).getByText('8.00 bar')).toBeInTheDocument();
    expect(within(thresholds).getByText('12.0 bar')).toBeInTheDocument();
  });

  it('counts the readings of the range beyond each threshold and the periods they came in', () => {
    renderPanel();

    expect(screen.getByText('2 readings beyond')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1 period' })).toBeInTheDocument();
    expect(screen.getByText('No readings beyond')).toBeInTheDocument();
  });

  it('counts only the readings inside the range', () => {
    renderPanel({ range: { start: 2 * MINUTE_MS, end: 10 * MINUTE_MS } });

    expect(screen.getByText('1 reading beyond')).toBeInTheDocument();
  });

  it('names the series that have no thresholds below those that do', () => {
    const flow = createSeriesView({ definition: createDefinition({ id: 's2', name: 'Flow' }) });
    const level = createSeriesView({ definition: createDefinition({ id: 's3', name: 'Level' }) });

    renderPanel({ series: [limitedSeries(), flow, level] });

    expect(screen.getByText('No thresholds for Flow, Level')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Thresholds of Flow' })).not.toBeInTheDocument();
  });

  it('says where a limit comes from only when a series mixes sources', () => {
    const mixed = createSeriesView({
      points: READINGS,
      thresholds: [
        createThreshold({ value: 8 }),
        createThreshold({
          level: ThresholdLevel.DANGER,
          value: 12,
          source: ThresholdSource.CONFIGURED,
        }),
      ],
    });

    renderPanel({ series: [mixed] });

    expect(screen.getByText('2 readings beyond · From the data source')).toBeInTheDocument();
    expect(screen.getByText('No readings beyond · Configured')).toBeInTheDocument();
  });
});

describe(ThresholdRow.name, () => {
  it('shows the level, the side and the value of the threshold', () => {
    renderRow();

    expect(screen.getByText('Alert')).toBeInTheDocument();
    expect(screen.getByText('High limit')).toBeInTheDocument();
    expect(screen.getByText('8.00 bar')).toBeInTheDocument();
  });

  it('names a lower danger limit', () => {
    renderRow({
      threshold: createThreshold({
        level: ThresholdLevel.DANGER,
        side: ThresholdSide.LOWER,
        value: 2,
      }),
    });

    expect(screen.getByText('Danger')).toBeInTheDocument();
    expect(screen.getByText('Low limit')).toBeInTheDocument();
  });

  it('names the threshold by its own label when it has one', () => {
    renderRow({ threshold: createThreshold({ label: 'Trip point' }) });

    expect(screen.getByText('Trip point')).toBeInTheDocument();
    expect(screen.queryByText('High limit')).not.toBeInTheDocument();
  });

  it('counts the readings below a lower limit', () => {
    renderRow({ threshold: createThreshold({ side: ThresholdSide.LOWER, value: 2 }) });

    expect(screen.getByText('1 reading beyond')).toBeInTheDocument();
  });

  it('says where the value comes from on hover', () => {
    renderRow();

    expect(screen.getByText('8.00 bar')).toHaveAttribute('title', 'From the data source');
  });

  it('adds the source to the summary when it is shown', () => {
    renderRow({ isSourceShown: true });

    expect(screen.getByText('2 readings beyond · From the data source')).toBeInTheDocument();
  });

  it('offers the periods beyond the limit when there are any', () => {
    const threshold = createThreshold({ value: 8 });

    renderRow({
      threshold,
      breaches: [{ threshold, from: MINUTE_MS, to: 2 * MINUTE_MS, peak: 10 }],
    });

    expect(screen.getByRole('button', { name: '1 period' })).toBeInTheDocument();
  });

  it('offers no periods when there are none', () => {
    renderRow();

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

function limitedSeries() {
  return createSeriesView({
    points: READINGS,
    thresholds: [
      createThreshold({ value: 8 }),
      createThreshold({ level: ThresholdLevel.DANGER, value: 12 }),
    ],
  });
}

function renderPanel(overrides: Partial<Parameters<typeof ThresholdsPanel>[0]> = {}) {
  return render(
    <ThresholdsPanel
      series={[limitedSeries()]}
      shouldShowThresholds
      onShowThresholdsChange={vi.fn()}
      range={TEN_MINUTES}
      {...overrides}
    />,
  );
}

function renderRow(overrides: Partial<Parameters<typeof ThresholdRow>[0]> = {}) {
  return render(
    <ul>
      <ThresholdRow
        threshold={createThreshold({ value: 8 })}
        series={createSeriesView({ points: READINGS })}
        range={TEN_MINUTES}
        breaches={[]}
        isSourceShown={false}
        {...overrides}
      />
    </ul>,
  );
}
