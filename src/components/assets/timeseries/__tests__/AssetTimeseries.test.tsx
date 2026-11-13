import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StoreApi } from 'zustand';

import { makeInstanceDetails } from '../../../../__mocks__/assets';
import { makeMockClient } from '../../../../__mocks__/cogniteClient';
import { makeLimitedList } from '../../../../__mocks__/lists';
import { makeQueryClientWrapper } from '../../../../__mocks__/QueryClientWrapper';
import { TIMESERIES_QUERY_LIMIT } from '../../../../constants/timeseries';
import { UseAssetTimeseriesContext } from '../../../../hooks/assets/timeseries/useAssetTimeseries';
import {
  UseTimeseriesChartViewModelContext,
  type UseTimeseriesChartViewModelContextType,
} from '../../../../hooks/assets/timeseries/useTimeseriesChartViewModel';
import { TimeseriesContext } from '../../../../hooks/assets/timeseries/useTimeseriesContext';
import { UseTimeseriesTrendsContext } from '../../../../hooks/assets/timeseries/useTimeseriesTrends';
import { AssetContext } from '../../../../hooks/assets/useAssetContext';
import { NavigationStoreContext } from '../../../../hooks/general/useNavigationState';
import { DEFAULT_NAVIGATION_STATE } from '../../../../lib/navigationState';
import type { AssetTimeseriesService } from '../../../../services/assets/timeseries/assetTimeseries';
import { createNavigationStore } from '../../../../store/navigation';
import type { NavigationStore } from '../../../../types/navigation';
import type { TimeseriesContextType, TimeseriesIdentifier } from '../../../../types/timeseries';
import { AssetTimeseries } from '../AssetTimeseries';

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };

describe(AssetTimeseries.name, () => {
  let mockContext: AssetTimeseriesService;
  let datapoints: TimeseriesContextType;
  let chartContext: UseTimeseriesChartViewModelContextType;
  let navigationStore: StoreApi<NavigationStore>;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    const client = makeMockClient();

    mockContext = {
      listAssetTimeseries: vi.fn(() =>
        Promise.resolve(
          makeLimitedList([
            makeInstanceDetails({
              externalId: 'PI.PT-101',
              properties: [
                { identifier: 'name', label: 'Name', value: 'Discharge pressure' },
                { identifier: 'engunits', label: 'Unit', value: 'bar' },
              ],
            }),
          ]),
        ),
      ),
    };
    datapoints = {
      project: 'asset-passport-test',
      getTrends: vi.fn((identifiers: TimeseriesIdentifier[]) =>
        Promise.resolve(
          identifiers.map((identifier) => ({
            ...identifier,
            points: [
              { timestamp: 1000, value: 2 },
              { timestamp: 2000, value: 8 },
            ],
          })),
        ),
      ),
    };
    navigationStore = createNavigationStore({
      initialState: { ...DEFAULT_NAVIGATION_STATE, selectedAsset: assetIdentifier },
    });
    chartContext = {
      now: () => 10_000,
    };
    const QueryWrapper = makeQueryClientWrapper();

    wrapper = ({ children }) => (
      <NavigationStoreContext.Provider value={navigationStore}>
        <UseAssetTimeseriesContext.Provider
          value={{ createAssetTimeseriesService: () => mockContext }}
        >
          <UseTimeseriesChartViewModelContext.Provider value={chartContext}>
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

  function renderList() {
    return render(<AssetTimeseries />, {
      wrapper,
    });
  }

  it('shows a loading status while the series load', () => {
    vi.mocked(mockContext.listAssetTimeseries).mockReturnValue(new Promise(() => {}));

    renderList();

    expect(screen.getByRole('status')).toHaveTextContent('Loading timeseries...');
  });

  it('shows each series with its name and properties, without a separate ID line', async () => {
    renderList();

    expect(await screen.findByRole('heading', { name: 'Discharge pressure' })).toBeInTheDocument();
    expect(screen.queryByText(/Timeseries ID/)).not.toBeInTheDocument();
    expect(screen.getByText('Unit')).toBeInTheDocument();
    expect(screen.getByText('bar')).toBeInTheDocument();
  });

  it('previews the last 6 months of a series with its readings', async () => {
    renderList();

    expect(
      await screen.findByRole('img', {
        name: 'Last 6 months: latest 8 bar, from 2 to 8 bar',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Latest').nextSibling).toHaveTextContent('8bar');
    expect(datapoints.getTrends).toHaveBeenCalledWith(
      [{ space: 'asset-instance-space', externalId: 'PI.PT-101' }],
      expect.objectContaining({ to: 10_000 }),
    );
  });

  it('shows a busy preview while the readings load', async () => {
    vi.mocked(datapoints.getTrends).mockReturnValue(new Promise(() => {}));

    renderList();

    expect(await screen.findByLabelText('Loading preview')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Discharge pressure' })).toBeInTheDocument();
  });

  it('keeps the series visible when its readings cannot be loaded', async () => {
    vi.mocked(datapoints.getTrends).mockRejectedValue(new Error('no access'));

    renderList();

    expect(await screen.findByText('The preview could not be loaded.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Discharge pressure' })).toBeInTheDocument();
  });

  it('lays the series out two to a row', async () => {
    vi.mocked(mockContext.listAssetTimeseries).mockResolvedValue(
      makeLimitedList([
        makeInstanceDetails({ externalId: 'PI.A' }),
        makeInstanceDetails({ externalId: 'PI.B' }),
      ]),
    );

    renderList();

    const cards = await screen.findAllByRole('region');

    expect(cards).toHaveLength(2);
    expect(cards[0].parentElement).toHaveClass('md:grid-cols-2');
  });

  it('opens a series in the chart when its preview is clicked', async () => {
    const user = userEvent.setup();

    renderList();

    await user.click(
      await screen.findByRole('button', {
        name: /^Discharge pressure:.*Open chart$/,
      }),
    );

    expect(navigationStore.getState().navigationState.timeseriesChart).toEqual(
      expect.objectContaining({
        sig: 'asset-instance-space:PI.PT-101',
        title: 'Discharge pressure',
      }),
    );
  });

  it('shows the chart while it is open', async () => {
    navigationStore = createNavigationStore({
      initialState: {
        ...DEFAULT_NAVIGATION_STATE,
        selectedAsset: assetIdentifier,
        timeseriesChart: { sig: 'asset-instance-space:PI.PT-101' },
      },
    });

    renderList();

    expect(await screen.findByRole('dialog', { name: /chart/i })).toBeInTheDocument();
  });

  it('does not show the chart while it is closed', async () => {
    renderList();

    await screen.findByRole('heading', { name: 'Discharge pressure' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('offers more series when the asset has more than were read', async () => {
    const user = userEvent.setup();

    vi.mocked(mockContext.listAssetTimeseries).mockResolvedValue(
      makeLimitedList([makeInstanceDetails({ externalId: 'PI.A' })], true),
    );
    renderList();

    await user.click(await screen.findByRole('button', { name: 'Show more timeseries' }));

    await waitFor(() =>
      expect(mockContext.listAssetTimeseries).toHaveBeenLastCalledWith(
        assetIdentifier,
        TIMESERIES_QUERY_LIMIT * 2,
      ),
    );
  });

  it('offers no more series once every series is read', async () => {
    renderList();

    await screen.findByRole('heading', { name: 'Discharge pressure' });
    expect(screen.queryByRole('button', { name: 'Show more timeseries' })).not.toBeInTheDocument();
  });

  it('shows an empty state when no series are linked', async () => {
    vi.mocked(mockContext.listAssetTimeseries).mockResolvedValue(makeLimitedList([]));

    renderList();

    expect(await screen.findByText('No timeseries linked')).toBeInTheDocument();
  });

  it('shows a readable error and retries the load', async () => {
    const user = userEvent.setup();

    vi.mocked(mockContext.listAssetTimeseries).mockRejectedValueOnce(new Error('no access'));
    renderList();

    expect(await screen.findByText('Timeseries could not be loaded')).toBeInTheDocument();
    expect(screen.getByText('Reason: no access')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('heading', { name: 'Discharge pressure' })).toBeInTheDocument();
  });
});
