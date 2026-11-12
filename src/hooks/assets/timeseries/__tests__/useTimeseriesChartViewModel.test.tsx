import { ChartRange, createChartConfiguration, parseConfiguration } from '@flows/trend-chart';
import { act, renderHook } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StoreApi } from 'zustand';

import { CHART_OPEN_WINDOW_MS } from '../../../../constants/timeseries';
import { DEFAULT_NAVIGATION_STATE } from '../../../../lib/navigationState';
import { makeInstanceDetails } from '../../../../mocks/assets';
import { createNavigationStore } from '../../../../store/navigation';
import type { NavigationStore } from '../../../../types/navigation';
import type { TimeseriesContextType } from '../../../../types/timeseries';
import { NavigationStoreContext } from '../../../general/useNavigationState';
import {
  UseTimeseriesChartViewModelContext,
  type UseTimeseriesChartViewModelContextType,
  useTimeseriesChartViewModel,
} from '../useTimeseriesChartViewModel';
import { TimeseriesContext } from '../useTimeseriesContext';

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };
const pressure = makeInstanceDetails({
  space: 'ts',
  externalId: 'PI.1',
  properties: [{ identifier: 'name', label: 'Name', value: 'Pressure' }],
});
const OPEN_CHART = { sig: 'ts:PI.1', title: 'Pressure' };
const NOW_MS = Date.UTC(2026, 10, 9, 12, 0, 30);
const NOW_MINUTE_MS = Date.UTC(2026, 10, 9, 12, 0, 0);

describe(useTimeseriesChartViewModel.name, () => {
  let context: UseTimeseriesChartViewModelContextType;
  let store: StoreApi<NavigationStore>;
  let client: TimeseriesContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    store = createNavigationStore();
    client = { project: 'p', getTrends: vi.fn(() => Promise.resolve([])) };
    context = {
      now: () => NOW_MS,
    };
    wrapper = ({ children }) => (
      <NavigationStoreContext.Provider value={store}>
        <UseTimeseriesChartViewModelContext.Provider value={context}>
          <TimeseriesContext.Provider value={client}>{children}</TimeseriesContext.Provider>
        </UseTimeseriesChartViewModelContext.Provider>
      </NavigationStoreContext.Provider>
    );
  });

  function renderViewModel() {
    return renderHook(() => useTimeseriesChartViewModel(assetIdentifier, [pressure]), { wrapper });
  }

  it('is closed with no configuration while there is no chart setup', () => {
    const { result } = renderViewModel();

    expect(result.current.isOpen).toBe(false);
    expect(result.current.configuration).toBeNull();
  });

  it('opens a chart on one series with a title', () => {
    const { result } = renderViewModel();

    act(() => result.current.openSeries('ts:PI.1', 'Pressure'));

    expect(store.getState().navigationState.timeseriesChart).toEqual(
      expect.objectContaining({ sig: 'ts:PI.1', title: 'Pressure' }),
    );
  });

  it('opens the chart on the last six months', () => {
    const { result } = renderViewModel();

    act(() => result.current.openSeries('ts:PI.1', 'Pressure'));

    const stored = store.getState().navigationState.timeseriesChart;
    if (!stored) throw new Error('The chart setup should have been stored.');
    const opened = parseConfiguration(stored, createChartConfiguration([]));
    expect(opened.range).toBe(ChartRange.CUSTOM);
    expect(opened.window).toEqual({
      start: NOW_MINUTE_MS - CHART_OPEN_WINDOW_MS,
      end: NOW_MINUTE_MS,
    });
  });

  it('reads the open chart back from its stored setup', () => {
    store = createNavigationStore({
      initialState: { ...DEFAULT_NAVIGATION_STATE, timeseriesChart: OPEN_CHART },
    });

    const { result } = renderViewModel();

    expect(result.current.isOpen).toBe(true);
    expect(result.current.configuration?.title).toBe('Pressure');
    expect(result.current.configuration?.series.map((entry) => entry.seriesId)).toEqual([
      'ts:PI.1',
    ]);
  });

  it('stores a changed configuration', () => {
    store = createNavigationStore({
      initialState: { ...DEFAULT_NAVIGATION_STATE, timeseriesChart: OPEN_CHART },
    });
    const { result } = renderViewModel();

    const configuration = result.current.configuration;
    if (!configuration) throw new Error('The chart should be open.');
    act(() => result.current.setConfiguration({ ...configuration, title: 'Renamed' }));

    expect(store.getState().navigationState.timeseriesChart).toEqual(
      expect.objectContaining({ title: 'Renamed' }),
    );
  });

  it('closes the chart', () => {
    store = createNavigationStore({
      initialState: { ...DEFAULT_NAVIGATION_STATE, timeseriesChart: OPEN_CHART },
    });
    const { result } = renderViewModel();

    act(() => result.current.close());

    expect(result.current.isOpen).toBe(false);
    expect(store.getState().navigationState.timeseriesChart).toBeUndefined();
  });

  it('fixes now to the minute', () => {
    const { result } = renderViewModel();

    expect(result.current.nowMs).toBe(NOW_MINUTE_MS);
  });

  it('scopes the data source to the project and the asset', () => {
    const { result } = renderViewModel();

    expect(result.current.source.scopeKey).toBe('timeseries:p:asset-space:FLOC-1');
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
