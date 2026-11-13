import {
  createChartConfiguration,
  type ChartConfiguration,
  type ChartDataSource,
} from '@flows/trend-chart';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeInstanceDetails } from '../../../../__mocks__/assets';
import { makeQueryClientWrapper } from '../../../../__mocks__/QueryClientWrapper';
import { createTimeseriesChartAdapter } from '../../../../services/assets/timeseries/timeseriesChartAdapter';
import type { TimeseriesContextType } from '../../../../types/timeseries';
import { TimeseriesChartDialog } from '../TimeseriesChartDialog';

const NOW_MS = Date.UTC(2026, 10, 9, 12);
const pressure = makeInstanceDetails({
  space: 'ts',
  externalId: 'PI.1',
  properties: [{ identifier: 'name', label: 'Name', value: 'Pressure' }],
});

describe(TimeseriesChartDialog.name, () => {
  let source: ChartDataSource;
  let onClose: () => void;
  let onConfigurationChange: (configuration: ChartConfiguration) => void;

  beforeEach(() => {
    const client: TimeseriesContextType = {
      project: 'p',
      getTrends: vi.fn(() => Promise.resolve([])),
    };

    source = {
      adapter: createTimeseriesChartAdapter(client, [pressure], {
        sourceName: 'CDF time series',
        isSimulated: false,
      }),
      scopeKey: 'timeseries:p:asset-space:FLOC-1',
    };
    onClose = vi.fn();
    onConfigurationChange = vi.fn();
  });

  function renderDialog(configuration: ChartConfiguration | null) {
    return render(
      <TimeseriesChartDialog
        source={source}
        configuration={configuration}
        nowMs={NOW_MS}
        exportName="FLOC-1"
        onConfigurationChange={onConfigurationChange}
        onClose={onClose}
      />,
      { wrapper: makeQueryClientWrapper() },
    );
  }

  it('is a dialog named after the chart and described by the asset', () => {
    renderDialog(createChartConfiguration(['ts:PI.1'], { title: 'Pressure' }));

    const dialog = screen.getByRole('dialog', { name: 'Pressure chart' });

    expect(dialog).toHaveAccessibleDescription('The timeseries of FLOC-1 in the chart workspace.');
  });

  it('closes from the chart', async () => {
    const user = userEvent.setup();

    renderDialog(createChartConfiguration(['ts:PI.1'], { title: 'Pressure' }));

    await user.click(screen.getByRole('button', { name: 'Close chart' }));

    expect(onClose).toHaveBeenCalled();
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();

    renderDialog(createChartConfiguration(['ts:PI.1'], { title: 'Pressure' }));

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalled();
  });

  it('opens without a chart, under a general name, while there is no configuration', () => {
    renderDialog(null);

    expect(screen.getByRole('dialog', { name: 'Timeseries chart' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Close chart' })).not.toBeInTheDocument();
  });
});
