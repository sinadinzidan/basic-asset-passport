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

  it('says so under a series that has no thresholds, and still offers to add one', () => {
    renderPanel({ series: [createSeriesView({ points: READINGS })] });

    expect(screen.getByText('No thresholds for this series yet.')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Add a threshold to Discharge pressure' }),
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

  it('lists every series, with or without thresholds, each with its own add button', () => {
    const flow = createSeriesView({ definition: createDefinition({ id: 's2', name: 'Flow' }) });
    const level = createSeriesView({ definition: createDefinition({ id: 's3', name: 'Level' }) });

    renderPanel({ series: [limitedSeries(), flow, level] });

    const bySeries = screen.getByRole('list', { name: 'Thresholds by series' });

    expect(within(bySeries).getAllByText('No thresholds for this series yet.')).toHaveLength(2);
    expect(screen.queryByRole('list', { name: 'Thresholds of Flow' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Add a threshold to / })).toHaveLength(3);
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
    expect(screen.getByText('No readings beyond · Added on this chart')).toBeInTheDocument();
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

describe('adding a threshold in the panel', () => {
  async function openForm(seriesName = 'Discharge pressure') {
    await userEvent.click(screen.getByRole('button', { name: `Add a threshold to ${seriesName}` }));

    return screen.getByRole('form', { name: `Add a threshold to ${seriesName}` });
  }

  it('offers nothing to add while no series is on the chart', () => {
    renderPanel({ series: [] });

    expect(screen.queryByRole('button', { name: /^Add a threshold to / })).not.toBeInTheDocument();
  });

  it('keeps the fields closed until the add button of a series is pressed', async () => {
    renderPanel();

    expect(screen.queryByLabelText('Value')).not.toBeInTheDocument();

    await openForm();

    expect(screen.getByLabelText('Value')).toBeInTheDocument();
  });

  it('adds an alert on the high side by default, in the unit the series is shown in, then closes', async () => {
    const onThresholdAdd = vi.fn(() => undefined);

    renderPanel({ onThresholdAdd });
    await openForm();
    await userEvent.type(screen.getByLabelText('Value'), '9.5');
    await userEvent.click(screen.getByRole('button', { name: 'Add threshold' }));

    expect(onThresholdAdd).toHaveBeenCalledWith({
      seriesId: 's1',
      level: ThresholdLevel.ALERT,
      side: ThresholdSide.UPPER,
      value: 9.5,
      unit: 'bar',
    });
    expect(screen.queryByLabelText('Value')).not.toBeInTheDocument();
  });

  it('adds to the series whose button was pressed', async () => {
    const onThresholdAdd = vi.fn(() => undefined);
    const flow = createSeriesView({
      definition: createDefinition({ id: 's2', name: 'Flow', unit: 'm3/h' }),
    });

    renderPanel({ series: [limitedSeries(), flow], onThresholdAdd });
    await openForm('Flow');
    await userEvent.type(screen.getByLabelText('Value'), '40{Enter}');

    expect(onThresholdAdd).toHaveBeenCalledWith(
      expect.objectContaining({ seriesId: 's2', value: 40, unit: 'm3/h' }),
    );
  });

  it('adds with the Enter key', async () => {
    const onThresholdAdd = vi.fn(() => undefined);

    renderPanel({ onThresholdAdd });
    await openForm();
    await userEvent.type(screen.getByLabelText('Value'), '4{Enter}');

    expect(onThresholdAdd).toHaveBeenCalledTimes(1);
  });

  it('asks for a value and adds nothing when the field is empty', async () => {
    const onThresholdAdd = vi.fn(() => undefined);

    renderPanel({ onThresholdAdd });
    await openForm();
    await userEvent.click(screen.getByRole('button', { name: 'Add threshold' }));

    expect(screen.getByText('Enter a value for the threshold.')).toBeInTheDocument();
    expect(onThresholdAdd).not.toHaveBeenCalled();
  });

  it('refuses a value that is not a number', async () => {
    const onThresholdAdd = vi.fn(() => undefined);

    renderPanel({ onThresholdAdd });
    await openForm();
    await userEvent.type(screen.getByLabelText('Value'), 'high');
    await userEvent.click(screen.getByRole('button', { name: 'Add threshold' }));

    expect(screen.getByText('The value must be a number.')).toBeInTheDocument();
    expect(onThresholdAdd).not.toHaveBeenCalled();
  });

  it('says why the chart refused the threshold and keeps what was typed', async () => {
    renderPanel({ onThresholdAdd: () => 'This threshold is already on the chart.' });
    await openForm();
    await userEvent.type(screen.getByLabelText('Value'), '8');
    await userEvent.click(screen.getByRole('button', { name: 'Add threshold' }));

    expect(screen.getByText('This threshold is already on the chart.')).toBeInTheDocument();
    expect(screen.getByLabelText('Value')).toHaveValue('8');
  });

  it('closes without adding when cancelled, and forgets what was typed', async () => {
    const onThresholdAdd = vi.fn(() => undefined);

    renderPanel({ onThresholdAdd });
    await openForm();
    await userEvent.type(screen.getByLabelText('Value'), '8');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await openForm();

    expect(onThresholdAdd).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Value')).toHaveValue('');
  });
});

describe('removing a threshold in the panel', () => {
  it('offers to remove only a threshold the user added', async () => {
    const onThresholdRemove = vi.fn();
    const added = createThreshold({
      id: 'configured:s1:ALERT:UPPER:9',
      value: 9,
      source: ThresholdSource.CONFIGURED,
    });
    renderPanel({
      series: [createSeriesView({ points: READINGS, thresholds: [createThreshold(), added] })],
      onThresholdRemove,
    });

    const removeButtons = screen.getAllByRole('button', { name: /^Remove the/ });
    expect(removeButtons).toHaveLength(1);

    await userEvent.click(removeButtons[0]);

    expect(onThresholdRemove).toHaveBeenCalledWith('configured:s1:ALERT:UPPER:9');
  });
});

function renderPanel(overrides: Partial<Parameters<typeof ThresholdsPanel>[0]> = {}) {
  return render(
    <ThresholdsPanel
      series={[limitedSeries()]}
      shouldShowThresholds
      onShowThresholdsChange={vi.fn()}
      range={TEN_MINUTES}
      onThresholdAdd={vi.fn()}
      onThresholdRemove={vi.fn()}
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
