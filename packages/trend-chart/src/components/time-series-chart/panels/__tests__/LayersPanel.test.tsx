import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';

import { ChartOverlay } from '../../../../enums/timeSeriesChart';
import type { ChartSeriesView } from '../../../../types/timeSeriesChart';
import { LayersPanel } from '../LayersPanel';

it('shows each series with a visibility switch and move buttons, the first unable to go up and the last unable to go down', () => {
  renderPanel();

  expect(screen.getByRole('switch', { name: 'Show Vibration on the chart' })).toBeChecked();
  expect(screen.getByRole('switch', { name: 'Show Current on the chart' })).not.toBeChecked();
  expect(screen.getByRole('button', { name: 'Move Vibration up' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Move Current down' })).toBeDisabled();
});

it('shows and hides a series with its switch', async () => {
  const onVisibilityChange = vi.fn();
  renderPanel({ onVisibilityChange });

  await userEvent.click(screen.getByRole('switch', { name: 'Show Vibration on the chart' }));
  await userEvent.click(screen.getByRole('switch', { name: 'Show Current on the chart' }));

  expect(onVisibilityChange).toHaveBeenNthCalledWith(1, 'v', false);
  expect(onVisibilityChange).toHaveBeenNthCalledWith(2, 'c', true);
});

it('moves a series and says where it went', async () => {
  const onMove = vi.fn();
  renderPanel({ onMove });

  await userEvent.click(screen.getByRole('button', { name: 'Move Vibration down' }));

  expect(onMove).toHaveBeenCalledWith('v', 1);
  expect(screen.getByRole('status')).toHaveTextContent('Vibration moved to position 2 of 2');
});

it('says so when no series is on the chart', () => {
  render(
    <LayersPanel
      series={[]}
      overlays={[]}
      onVisibilityChange={vi.fn()}
      onMove={vi.fn()}
      onToggleOverlay={vi.fn()}
    />,
  );

  expect(screen.getByText('No series on the chart')).toBeInTheDocument();
});

it('toggles an overlay with its switch', async () => {
  const onToggleOverlay = vi.fn();
  renderPanel({ onToggleOverlay });

  const switches = screen.getAllByRole('switch');
  await userEvent.click(switches[switches.length - 1] ?? document.body);

  expect(onToggleOverlay).toHaveBeenCalledOnce();
});

function renderPanel(overrides: Partial<Parameters<typeof LayersPanel>[0]> = {}) {
  const series = [entry('v', 'Vibration', true), entry('c', 'Current', false)];
  return render(
    <LayersPanel
      series={series}
      overlays={[ChartOverlay.THRESHOLDS]}
      onVisibilityChange={vi.fn()}
      onMove={vi.fn()}
      onToggleOverlay={vi.fn()}
      {...overrides}
    />,
  );
}
function entry(seriesId: string, name: string, isVisible: boolean): ChartSeriesView {
  return {
    configuration: { seriesId, isVisible, style: { color: '#000', lineWidth: 1.5 } },
    definition: {
      id: seriesId,
      name,
      tag: 'T',
      description: name,
      sourceName: 'Demo',
      isSimulated: true,
    },
  } as Partial<ChartSeriesView> as ChartSeriesView;
}
