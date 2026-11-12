import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StoreApi } from 'zustand';

import { NO_TAB_COUNTS } from '../../../__mocks__/assetDetailsTabCounts';
import { makeInstanceDetails } from '../../../__mocks__/assets';
import { makeMockClient } from '../../../__mocks__/cogniteClient';
import { makeLimitedList } from '../../../__mocks__/lists';
import { makeNavigationStore } from '../../../__mocks__/navigation';
import { makeQueryClientWrapper } from '../../../__mocks__/QueryClientWrapper';
import { TIMESERIES_QUERY_LIMIT } from '../../../constants/timeseries';
import { AssetTab } from '../../../enums/assetTab';
import { UseAssetTimeseriesContext } from '../../../hooks/assets/timeseries/useAssetTimeseries';
import { UseTimeseriesChartViewModelContext } from '../../../hooks/assets/timeseries/useTimeseriesChartViewModel';
import { TimeseriesContext } from '../../../hooks/assets/timeseries/useTimeseriesContext';
import { UseTimeseriesTrendsContext } from '../../../hooks/assets/timeseries/useTimeseriesTrends';
import { AssetContext } from '../../../hooks/assets/useAssetContext';
import { NavigationStoreContext } from '../../../hooks/general/useNavigationState';
import type { AssetTimeseriesService } from '../../../services/assets/timeseries/assetTimeseries';
import type { NavigationStore } from '../../../types/navigation';
import { AssetDetailsTabs } from '../AssetDetailsTabs';

const asset = makeInstanceDetails({
  space: 'asset-space',
  externalId: 'FLOC-7',
});

const datapoints = {
  project: 'asset-passport-test',
  getTrends: () => Promise.resolve([]),
};

describe(`${AssetDetailsTabs.name} timeseries`, () => {
  let listContext: AssetTimeseriesService;
  let wrapper: ComponentType<{ children: ReactNode }>;
  let store: StoreApi<NavigationStore>;

  beforeEach(() => {
    store = makeNavigationStore();
    const client = makeMockClient();
    listContext = {
      listAssetTimeseries: vi.fn(() =>
        Promise.resolve(
          makeLimitedList([
            makeInstanceDetails({
              externalId: 'PI.PT-101',
              properties: [
                {
                  identifier: 'name',
                  label: 'Name',
                  value: 'Discharge pressure',
                },
              ],
            }),
          ]),
        ),
      ),
    };
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <NavigationStoreContext.Provider value={store}>
        <UseAssetTimeseriesContext.Provider
          value={{ createAssetTimeseriesService: () => listContext }}
        >
          <UseTimeseriesChartViewModelContext.Provider
            value={{
              now: () => 10_000,
            }}
          >
            <UseTimeseriesTrendsContext.Provider
              value={{
                now: () => 10_000,
              }}
            >
              <QueryWrapper>
                <TimeseriesContext.Provider value={datapoints}>
                  <AssetContext.Provider value={client}>{children}</AssetContext.Provider>
                </TimeseriesContext.Provider>
              </QueryWrapper>
            </UseTimeseriesTrendsContext.Provider>
          </UseTimeseriesChartViewModelContext.Provider>
        </UseAssetTimeseriesContext.Provider>
      </NavigationStoreContext.Provider>
    );
  });

  it('lists the timeseries of the open asset on the timeseries tab', async () => {
    store = makeNavigationStore({ activeAssetTab: AssetTab.TIMESERIES });
    render(<AssetDetailsTabs asset={asset} tabCounts={NO_TAB_COUNTS} />, { wrapper });

    expect(await screen.findByRole('heading', { name: 'Discharge pressure' })).toBeInTheDocument();
    expect(listContext.listAssetTimeseries).toHaveBeenCalledWith(
      { space: 'asset-space', externalId: 'FLOC-7' },
      TIMESERIES_QUERY_LIMIT,
    );
  });

  it('switches to the timeseries tab when it is chosen', async () => {
    const user = userEvent.setup();
    render(<AssetDetailsTabs asset={asset} tabCounts={NO_TAB_COUNTS} />, { wrapper });

    await user.click(screen.getByRole('tab', { name: 'Timeseries' }));

    expect(store.getState().navigationState.activeAssetTab).toBe(AssetTab.TIMESERIES);
    expect(await screen.findByRole('heading', { name: 'Discharge pressure' })).toBeInTheDocument();
  });
});
