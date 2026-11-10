import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AssetEquipmentTab } from '../../../enums/assetEquipmentTab';
import {
  UseAssetTimeseriesContext,
  type UseAssetTimeseriesContextType,
} from '../../../hooks/assets/timeseries/useAssetTimeseries';
import { UseTimeseriesChartViewModelContext } from '../../../hooks/assets/timeseries/useTimeseriesChartViewModel';
import { UseTimeseriesTrendsContext } from '../../../hooks/timeseries/useTimeseriesTrends';
import { makeInstanceDetails } from '../../../mocks/assets';
import { makeMockClient } from '../../../mocks/cogniteClient';
import { makeQueryClientWrapper } from '../../../mocks/queryClientWrapper';
import { AssetDetailsTabs } from '../AssetDetailsTabs';

const details = {
  asset: makeInstanceDetails({ space: 'asset-space', externalId: 'FLOC-7' }),
  equipment: [],
};

const datapoints = {
  project: 'asset-passport-test',
  getTrends: () => Promise.resolve([]),
};

describe(`${AssetDetailsTabs.name} timeseries`, () => {
  let listContext: UseAssetTimeseriesContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    const client = makeMockClient();
    listContext = {
      useAssetDataClient: vi.fn(() => client),
      listAssetTimeseries: vi.fn(() =>
        Promise.resolve([
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
    };
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <UseAssetTimeseriesContext.Provider value={listContext}>
        <UseTimeseriesChartViewModelContext.Provider
          value={{
            useTimeseriesChartState: () => ({
              options: null,
              onChange: vi.fn(),
            }),
            useTimeseriesDatapointsClient: () => datapoints,
            now: () => 10_000,
          }}
        >
          <UseTimeseriesTrendsContext.Provider
            value={{
              useTimeseriesDatapointsClient: () => datapoints,
              now: () => 10_000,
            }}
          >
            <QueryWrapper>{children}</QueryWrapper>
          </UseTimeseriesTrendsContext.Provider>
        </UseTimeseriesChartViewModelContext.Provider>
      </UseAssetTimeseriesContext.Provider>
    );
  });

  it('lists the timeseries of the open asset on the timeseries tab', async () => {
    render(
      <AssetDetailsTabs
        details={details}
        activeTab={AssetEquipmentTab.TIMESERIES}
        onTabChange={vi.fn()}
      />,
      { wrapper },
    );

    expect(
      await screen.findByRole('heading', { name: 'Discharge pressure' }),
    ).toBeInTheDocument();
    expect(listContext.listAssetTimeseries).toHaveBeenCalledWith(
      expect.anything(),
      { space: 'asset-space', externalId: 'FLOC-7' },
    );
  });

  it('reports the timeseries tab when it is selected', async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    render(
      <AssetDetailsTabs
        details={details}
        activeTab={AssetEquipmentTab.PROPERTIES}
        onTabChange={onTabChange}
      />,
      { wrapper },
    );

    await user.click(screen.getByRole('tab', { name: 'Timeseries' }));

    expect(onTabChange).toHaveBeenCalledWith(AssetEquipmentTab.TIMESERIES);
  });
});
