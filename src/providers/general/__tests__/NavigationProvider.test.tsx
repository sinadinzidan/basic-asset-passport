import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AssetTab } from '../../../enums/assetTab';
import {
  NavigationContext,
  useNavigationState,
  type NavigationDeps,
} from '../../../hooks/general/useNavigationState';
import type { StateSyncApi } from '../../../types/host';
import { NavigationProvider } from '../NavigationProvider';

const selectedAsset = { space: 'asset-space', externalId: 'asset-1' };

describe(NavigationProvider.name, () => {
  let api: StateSyncApi;
  let deps: NavigationDeps;

  beforeEach(() => {
    api = {
      syncInternalState: vi.fn<StateSyncApi['syncInternalState']>(() => Promise.resolve(true)),
    };
    deps = { logError: vi.fn(), now: () => 5000 };
  });

  function renderProvider(hostApi: StateSyncApi | null, initialState?: string) {
    render(
      <NavigationContext.Provider value={deps}>
        <NavigationProvider api={hostApi} initialState={initialState}>
          <Probe />
        </NavigationProvider>
      </NavigationContext.Provider>,
    );
  }

  it('restores the screen from the host', () => {
    renderProvider(api, JSON.stringify({ searchQuery: 'pump' }));

    expect(screen.getByText('Searching for pump')).toBeVisible();
    expect(api.syncInternalState).not.toHaveBeenCalled();
  });

  it('starts the chart clock at the time the app opened', () => {
    renderProvider(api);

    expect(screen.getByText('Chart clock 5000')).toBeVisible();
  });

  it('falls back to the register when the host state is unreadable', () => {
    renderProvider(api, 'not json');

    expect(screen.getByText('Searching for nothing')).toBeVisible();
  });

  it('syncs each change back to the host', async () => {
    renderProvider(api);

    await userEvent.click(screen.getByRole('button', { name: 'Open asset' }));

    expect(api.syncInternalState).toHaveBeenCalledWith(
      JSON.stringify({ selectedAsset, activeAssetTab: AssetTab.PROPERTIES }),
    );
  });

  it('still navigates when there is no host to sync to', async () => {
    renderProvider(null);

    await userEvent.click(screen.getByRole('button', { name: 'Search for pump' }));

    expect(screen.getByText('Searching for pump')).toBeVisible();
  });

  it('logs a failed sync without losing the navigation', async () => {
    const error = new Error('sync failed');
    vi.mocked(api.syncInternalState).mockRejectedValue(error);
    renderProvider(api);

    await userEvent.click(screen.getByRole('button', { name: 'Search for pump' }));

    expect(deps.logError).toHaveBeenCalledWith('Failed to sync navigation state.', error);
    expect(screen.getByText('Searching for pump')).toBeVisible();
  });

  it('logs a failed sync to the console by default', async () => {
    const error = new Error('sync failed');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(api.syncInternalState).mockRejectedValue(error);
    render(
      <NavigationProvider api={api}>
        <Probe />
      </NavigationProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Search for pump' }));

    expect(consoleError).toHaveBeenCalledWith('Failed to sync navigation state.', error);
  });
});

function Probe() {
  const searchQuery = useNavigationState((store) => store.navigationState.searchQuery);
  const { changeSearchQuery, selectAsset } = useNavigationState((store) => store.actions);
  const chartClockMs = useNavigationState((store) => store.timeseriesChartClockMs);

  return (
    <>
      <p>Searching for {searchQuery ?? 'nothing'}</p>
      <p>Chart clock {chartClockMs}</p>
      <button onClick={() => changeSearchQuery('pump')} type="button">
        Search for pump
      </button>
      <button onClick={() => selectAsset(selectedAsset)} type="button">
        Open asset
      </button>
    </>
  );
}
