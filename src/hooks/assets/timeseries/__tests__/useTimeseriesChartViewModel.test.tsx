import {
  ChartRange,
  createChartConfiguration,
  parseConfiguration,
} from '@flows/trend-chart';
import { renderHook } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CHART_OPEN_WINDOW_MS } from '../../../../constants/timeseries';
import { makeInstanceDetails } from '../../../../mocks/assets';
import type { TimeseriesDatapointsClient } from '../../../../types/timeseries';
import {
  UseTimeseriesChartViewModelContext,
  type UseTimeseriesChartViewModelContextType,
  useTimeseriesChartViewModel,
} from '../useTimeseriesChartViewModel';

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };
const pressure = makeInstanceDetails({
  space: 'ts',
  externalId: 'PI.1',
  properties: [{ identifier: 'name', label: 'Name', value: 'Pressure' }],
});
const NOW_MS = Date.UTC(2026, 10, 9, 12, 0, 30);
const NOW_MINUTE_MS = Date.UTC(2026, 10, 9, 12, 0, 0);

describe(useTimeseriesChartViewModel.name, () => {
  let context: UseTimeseriesChartViewModelContextType;
  let onChange: ReturnType<
    typeof vi.fn<(options: Record<string, string> | null) => void>
  >;
  let client: TimeseriesDatapointsClient;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    onChange = vi.fn();
    client = { project: 'p', getTrends: vi.fn(() => Promise.resolve([])) };
    context = {
      useTimeseriesChartState: vi.fn(() => ({ options: null, onChange })),
      useTimeseriesDatapointsClient: () => client,
      now: () => NOW_MS,
    };
    wrapper = ({ children }) => (
      <UseTimeseriesChartViewModelContext.Provider value={context}>
        {children}
      </UseTimeseriesChartViewModelContext.Provider>
    );
  });

  function renderViewModel() {
    return renderHook(
      () => useTimeseriesChartViewModel(assetIdentifier, [pressure]),
      { wrapper },
    );
  }

  it('is closed with no configuration while there is no chart setup', () => {
    const { result } = renderViewModel();

    expect(result.current.isOpen).toBe(false);
    expect(result.current.configuration).toBeNull();
  });

  it('opens a chart on one series with a title', () => {
    const { result } = renderViewModel();

    result.current.openSeries('ts:PI.1', 'Pressure');

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ sig: 'ts:PI.1', title: 'Pressure' }),
    );
  });

  it('opens the chart on the last six months', () => {
    const { result } = renderViewModel();

    result.current.openSeries('ts:PI.1', 'Pressure');

    const stored = onChange.mock.calls[0]?.[0];
    if (!stored) throw new Error('The chart setup should have been stored.');
    const opened = parseConfiguration(stored, createChartConfiguration([]));
    expect(opened.range).toBe(ChartRange.CUSTOM);
    expect(opened.window).toEqual({
      start: NOW_MINUTE_MS - CHART_OPEN_WINDOW_MS,
      end: NOW_MINUTE_MS,
    });
  });

  it('reads the open chart back from its stored setup', () => {
    vi.mocked(context.useTimeseriesChartState).mockReturnValue({
      options: { sig: 'ts:PI.1', title: 'Pressure' },
      onChange,
    });

    const { result } = renderViewModel();

    expect(result.current.isOpen).toBe(true);
    expect(result.current.configuration?.title).toBe('Pressure');
    expect(
      result.current.configuration?.series.map((entry) => entry.seriesId),
    ).toEqual(['ts:PI.1']);
  });

  it('stores a changed configuration', () => {
    vi.mocked(context.useTimeseriesChartState).mockReturnValue({
      options: { sig: 'ts:PI.1' },
      onChange,
    });
    const { result } = renderViewModel();

    const configuration = result.current.configuration;
    if (!configuration) throw new Error('The chart should be open.');
    result.current.setConfiguration({ ...configuration, title: 'Renamed' });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Renamed' }),
    );
  });

  it('closes the chart', () => {
    const { result } = renderViewModel();

    result.current.close();

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('fixes now to the minute', () => {
    const { result } = renderViewModel();

    expect(result.current.nowMs).toBe(NOW_MINUTE_MS);
  });

  it('scopes the data source to the project and the asset', () => {
    const { result } = renderViewModel();

    expect(result.current.source.scopeKey).toBe(
      'timeseries:p:asset-space:FLOC-1',
    );
  });

  it('serves the series of the asset to the chart', async () => {
    const { result } = renderViewModel();

    const page = await result.current.source.adapter.searchSeries('', {
      limit: 10,
    });

    expect(page.series.map((series) => series.id)).toEqual(['ts:PI.1']);
  });

  it('marks the source as generated when the client is simulated', async () => {
    client = { ...client, isSimulated: true };
    const { result } = renderViewModel();

    const page = await result.current.source.adapter.searchSeries('', {
      limit: 10,
    });

    expect(page.series[0]).toMatchObject({ isSimulated: true });
  });
});
