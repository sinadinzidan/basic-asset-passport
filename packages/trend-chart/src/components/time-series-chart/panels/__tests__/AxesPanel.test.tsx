import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ChartMode } from '../../../../enums/monitoring';
import { AxisScaleMode } from '../../../../enums/timeSeriesChart';
import { createDefinition, createSeriesView } from '../../../../mocks/chartData';
import { AxesPanel } from '../AxesPanel';

const NORMALISE = 'Normalise to 0 to 100 %';
const FLOW = createSeriesView({
  definition: createDefinition({ id: 's2', name: 'Flow', unit: 'm³/h' }),
});

describe(AxesPanel.name, () => {
  it('shows whether the series are normalised', () => {
    const { rerender } = renderPanel({ mode: ChartMode.OVERLAID });
    expect(screen.getByRole('switch', { name: NORMALISE })).not.toBeChecked();

    rerender(panel({ mode: ChartMode.NORMALISED }));

    expect(screen.getByRole('switch', { name: NORMALISE })).toBeChecked();
  });

  it('normalises the series with the switch', async () => {
    const onModeChange = vi.fn();
    renderPanel({ mode: ChartMode.OVERLAID, onModeChange });

    await userEvent.click(screen.getByRole('switch', { name: NORMALISE }));

    expect(onModeChange).toHaveBeenCalledWith(ChartMode.NORMALISED);
  });

  it('goes back to overlaid axes when normalising is turned off', async () => {
    const onModeChange = vi.fn();
    renderPanel({ mode: ChartMode.NORMALISED, onModeChange });

    await userEvent.click(screen.getByRole('switch', { name: NORMALISE }));

    expect(onModeChange).toHaveBeenCalledWith(ChartMode.OVERLAID);
  });

  it('says why no limits can be set while the series are normalised', () => {
    renderPanel({ mode: ChartMode.NORMALISED });

    expect(
      screen.getByText(
        'Limits apply to the axes in their own units. Turn normalising off to set them.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('says so when there is no series to scale', () => {
    renderPanel({ series: [] });

    expect(screen.getByText('No series to scale')).toBeInTheDocument();
  });

  it('gives each series the limits of its axis, automatic until they are set, and its unit', () => {
    renderPanel({ series: [createSeriesView(), FLOW] });

    const flowAxis = within(screen.getByRole('group', { name: 'Axis of Flow' }));
    expect(flowAxis.getByRole('textbox', { name: 'Minimum' })).toHaveValue('');
    expect(flowAxis.getByRole('textbox', { name: 'Maximum' })).toHaveAttribute(
      'placeholder',
      'Automatic',
    );
    expect(flowAxis.getByText('m³/h')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Axis of Discharge pressure' })).toBeInTheDocument();
  });

  it('offers nothing to press while an automatic axis is unchanged', () => {
    renderPanel();

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('sets the limits that are typed once they are applied', async () => {
    const onAxesChange = vi.fn();
    renderPanel({ onAxesChange });

    await userEvent.type(screen.getByRole('textbox', { name: 'Minimum' }), '0');
    await userEvent.type(screen.getByRole('textbox', { name: 'Maximum' }), '10');
    await userEvent.click(screen.getByRole('button', { name: 'Apply limits' }));

    expect(onAxesChange).toHaveBeenCalledWith([
      { seriesId: 's1', mode: AxisScaleMode.MANUAL, min: 0, max: 10 },
    ]);
  });

  it('sets one limit and leaves the other automatic', async () => {
    const onAxesChange = vi.fn();
    renderPanel({ onAxesChange });

    await userEvent.type(screen.getByRole('textbox', { name: 'Maximum' }), '12,5');
    await userEvent.click(screen.getByRole('button', { name: 'Apply limits' }));

    expect(onAxesChange).toHaveBeenCalledWith([
      { seriesId: 's1', mode: AxisScaleMode.MANUAL, min: undefined, max: 12.5 },
    ]);
  });

  it('keeps the limits of the other series when one is set', async () => {
    const onAxesChange = vi.fn();
    const flowLimits = { seriesId: 's2', mode: AxisScaleMode.MANUAL, min: 0, max: 500 };
    renderPanel({ series: [createSeriesView(), FLOW], axes: [flowLimits], onAxesChange });
    const pressureAxis = within(screen.getByRole('group', { name: 'Axis of Discharge pressure' }));

    await userEvent.type(pressureAxis.getByRole('textbox', { name: 'Minimum' }), '2');
    await userEvent.click(pressureAxis.getByRole('button', { name: 'Apply limits' }));

    expect(onAxesChange).toHaveBeenCalledWith([
      flowLimits,
      { seriesId: 's1', mode: AxisScaleMode.MANUAL, min: 2, max: undefined },
    ]);
  });

  it('refuses a limit that is not a number and says so', async () => {
    const onAxesChange = vi.fn();
    renderPanel({ onAxesChange });

    await userEvent.type(screen.getByRole('textbox', { name: 'Minimum' }), 'low');
    await userEvent.click(screen.getByRole('button', { name: 'Apply limits' }));

    expect(screen.getByRole('alert')).toHaveTextContent('The minimum must be a number.');
    expect(onAxesChange).not.toHaveBeenCalled();
  });

  it('refuses a minimum that is not below the maximum', async () => {
    const onAxesChange = vi.fn();
    renderPanel({ onAxesChange });

    await userEvent.type(screen.getByRole('textbox', { name: 'Minimum' }), '10');
    await userEvent.type(screen.getByRole('textbox', { name: 'Maximum' }), '5');
    await userEvent.click(screen.getByRole('button', { name: 'Apply limits' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'The minimum must be lower than the maximum.',
    );
    expect(onAxesChange).not.toHaveBeenCalled();
  });

  it('takes the error away once the limits are right', async () => {
    renderPanel();
    await userEvent.type(screen.getByRole('textbox', { name: 'Minimum' }), 'low');
    await userEvent.click(screen.getByRole('button', { name: 'Apply limits' }));

    await userEvent.clear(screen.getByRole('textbox', { name: 'Minimum' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Minimum' }), '1');
    await userEvent.click(screen.getByRole('button', { name: 'Apply limits' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the limits of a manual axis and offers to go back to automatic', () => {
    renderPanel({ axes: [{ seriesId: 's1', mode: AxisScaleMode.MANUAL, min: 0, max: 10 }] });

    expect(screen.getByRole('textbox', { name: 'Minimum' })).toHaveValue('0');
    expect(screen.getByRole('textbox', { name: 'Maximum' })).toHaveValue('10');
    expect(screen.getByRole('button', { name: 'Use automatic' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Apply limits' })).not.toBeInTheDocument();
  });

  it('drops the limits of an axis that goes back to automatic', async () => {
    const onAxesChange = vi.fn();
    renderPanel({
      axes: [{ seriesId: 's1', mode: AxisScaleMode.MANUAL, min: 0, max: 10 }],
      onAxesChange,
    });

    await userEvent.click(screen.getByRole('button', { name: 'Use automatic' }));

    expect(onAxesChange).toHaveBeenCalledWith([]);
    expect(screen.getByRole('textbox', { name: 'Minimum' })).toHaveValue('');
  });

  it('goes back to automatic when both limits are cleared and applied', async () => {
    const onAxesChange = vi.fn();
    renderPanel({
      axes: [{ seriesId: 's1', mode: AxisScaleMode.MANUAL, min: 0, max: 10 }],
      onAxesChange,
    });

    await userEvent.clear(screen.getByRole('textbox', { name: 'Minimum' }));
    await userEvent.clear(screen.getByRole('textbox', { name: 'Maximum' }));
    await userEvent.click(screen.getByRole('button', { name: 'Apply limits' }));

    expect(onAxesChange).toHaveBeenCalledWith([]);
  });
});

type PanelProperties = Parameters<typeof AxesPanel>[0];

function panel(overrides: Partial<PanelProperties> = {}) {
  return (
    <AxesPanel
      series={[createSeriesView()]}
      axes={[]}
      mode={ChartMode.OVERLAID}
      onAxesChange={vi.fn()}
      onModeChange={vi.fn()}
      {...overrides}
    />
  );
}

function renderPanel(overrides: Partial<PanelProperties> = {}) {
  return render(panel(overrides));
}
