import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { makeInstanceDetails } from '../../../../__mocks__/assets';
import { TimeseriesPreviewKind } from '../../../../enums/timeseriesPreviewKind';
import type { AssetTimeseriesItem } from '../../../../hooks/assets/timeseries/view-models/useAssetTimeseriesViewModel';
import { TimeseriesDetails } from '../TimeseriesDetails';

const pressure = makeInstanceDetails({
  space: 'ts',
  externalId: 'PI.1',
  properties: [{ identifier: 'name', label: 'Name', value: 'Pressure' }],
});
const unnamed = makeInstanceDetails({
  space: 'ts',
  externalId: 'PI.2',
  properties: [],
});
const POINTS = [{ timestamp: 1000, value: 3 }];

describe(TimeseriesDetails.name, () => {
  it('is headed by the name of the series', () => {
    render(<TimeseriesDetails item={makeItem()} />);

    expect(screen.getByRole('region', { name: 'Pressure' })).toBeVisible();
  });

  it('is headed by the external ID when the series has no name', () => {
    render(<TimeseriesDetails item={makeItem({ timeseries: unnamed })} />);

    expect(screen.getByRole('heading', { name: 'PI.2' })).toBeVisible();
  });

  it('opens the series in the chart from its preview', async () => {
    const user = userEvent.setup();
    const onOpenChart = vi.fn();

    render(<TimeseriesDetails item={makeItem()} onOpenChart={onOpenChart} />);

    await user.click(screen.getByRole('button', { name: /^Pressure:.*Open chart$/ }));

    expect(onOpenChart).toHaveBeenCalledWith(pressure);
  });

  it('makes the preview an Aura button', () => {
    render(<TimeseriesDetails item={makeItem()} onOpenChart={vi.fn()} />);

    expect(screen.getByRole('button', { name: /^Pressure:.*Open chart$/ })).toHaveAttribute(
      'data-slot',
      'button',
    );
  });

  it('offers no chart when there is nothing to open it with', () => {
    render(<TimeseriesDetails item={makeItem()} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('offers no chart for a series that is not numeric', () => {
    render(
      <TimeseriesDetails
        item={makeItem({ preview: { kind: TimeseriesPreviewKind.NON_NUMERIC } })}
        onOpenChart={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

function makeItem(overrides: Partial<AssetTimeseriesItem> = {}): AssetTimeseriesItem {
  return {
    timeseries: pressure,
    unit: 'bar',
    preview: { kind: TimeseriesPreviewKind.READY, points: POINTS },
    ...overrides,
  };
}
