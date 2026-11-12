import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StoreApi } from 'zustand';

import { TIMESERIES_QUERY_LIMIT } from '../../../constants/timeseries';
import { AssetTab } from '../../../enums/assetTab';
import {
  UseAssetTimeseriesContext,
  type UseAssetTimeseriesContextType,
} from '../../../hooks/assets/timeseries/useAssetTimeseries';
import { UseTimeseriesChartViewModelContext } from '../../../hooks/assets/timeseries/useTimeseriesChartViewModel';
import { TimeseriesContext } from '../../../hooks/assets/timeseries/useTimeseriesContext';
import { UseTimeseriesTrendsContext } from '../../../hooks/assets/timeseries/useTimeseriesTrends';
import { AssetContext } from '../../../hooks/assets/useAssetContext';
import { NavigationStoreContext } from '../../../hooks/general/useNavigationState';
import { NO_TAB_COUNTS } from '../../../mocks/assetDetailsTabCounts';
import { makeInstanceDetails } from '../../../mocks/assets';
import { makeMockClient } from '../../../mocks/cogniteClient';
import { makeLimitedList } from '../../../mocks/lists';
import { makeNavigationStore } from '../../../mocks/navigation';
import { makeQueryClientWrapper } from '../../../mocks/QueryClientWrapper';
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
  let listContext: UseAssetTimeseriesContextType;
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
        <UseAssetTimeseriesContext.Provider value={listContext}>
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
      expect.anything(),
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
