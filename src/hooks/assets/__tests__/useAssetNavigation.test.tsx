import { act, renderHook } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AssetEquipmentTab } from '../../../enums/assetEquipmentTab';
import type { StateSyncApi } from '../../../types/host';
import {
  AssetNavigationContext,
  type AssetNavigationDeps,
  useAssetNavigation,
} from '../useAssetNavigation';

const selectedAsset = { space: 'asset-space', externalId: 'asset-1' };

describe(useAssetNavigation.name, () => {
  let api: StateSyncApi;
  let deps: AssetNavigationDeps;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    api = {
      syncInternalState: vi.fn<StateSyncApi['syncInternalState']>(() =>
        Promise.resolve(true),
      ),
    };
    deps = { logError: vi.fn() };
    wrapper = ({ children }) => (
      <AssetNavigationContext.Provider value={deps}>
        {children}
      </AssetNavigationContext.Provider>
    );
  });

  it('starts from the state restored from the host', () => {
    const initialState = JSON.stringify({
      selectedAsset,
      activeEquipmentTab: AssetEquipmentTab.EQUIPMENTS,
    });

    const { result } = renderHook(() => useAssetNavigation(api, initialState), {
      wrapper,
    });

    expect(result.current.navigationState).toEqual({
      selectedAsset,
      activeEquipmentTab: AssetEquipmentTab.EQUIPMENTS,
    });
  });

  it('selects an asset on the properties tab and syncs it to the host', () => {
    const { result } = renderHook(() => useAssetNavigation(api), { wrapper });

    act(() => result.current.selectAsset(selectedAsset));

    const expectedState = {
      selectedAsset,
      activeEquipmentTab: AssetEquipmentTab.PROPERTIES,
    };
    expect(result.current.navigationState).toEqual(expectedState);
    expect(api.syncInternalState).toHaveBeenCalledWith(
      JSON.stringify(expectedState),
    );
  });

  it('changes the tab and keeps the selection', () => {
    const initialState = JSON.stringify({ selectedAsset });
    const { result } = renderHook(() => useAssetNavigation(api, initialState), {
      wrapper,
    });

    act(() => result.current.changeEquipmentTab(AssetEquipmentTab.EQUIPMENTS));

    expect(result.current.navigationState).toEqual({
      selectedAsset,
      activeEquipmentTab: AssetEquipmentTab.EQUIPMENTS,
    });
  });

  it('opens a chart and syncs its setup to the host', () => {
    const initialState = JSON.stringify({ selectedAsset });
    const { result } = renderHook(() => useAssetNavigation(api, initialState), {
      wrapper,
    });

    act(() => result.current.changeTimeseriesChart({ sig: 'ts:PI.1' }));

    expect(result.current.navigationState.timeseriesChart).toEqual({
      sig: 'ts:PI.1',
    });
    expect(api.syncInternalState).toHaveBeenCalledWith(
      JSON.stringify({
        selectedAsset,
        activeEquipmentTab: AssetEquipmentTab.PROPERTIES,
        timeseriesChart: { sig: 'ts:PI.1' },
      }),
    );
  });

  it('closes the chart when given no setup', () => {
    const initialState = JSON.stringify({
      selectedAsset,
      timeseriesChart: { sig: 'ts:PI.1' },
    });
    const { result } = renderHook(() => useAssetNavigation(api, initialState), {
      wrapper,
    });

    act(() => result.current.changeTimeseriesChart(null));

    expect(result.current.navigationState).not.toHaveProperty(
      'timeseriesChart',
    );
  });

  it('closes the chart when the tab or the asset changes', () => {
    const initialState = JSON.stringify({
      selectedAsset,
      timeseriesChart: { sig: 'ts:PI.1' },
    });
    const { result } = renderHook(() => useAssetNavigation(api, initialState), {
      wrapper,
    });

    act(() => result.current.changeEquipmentTab(AssetEquipmentTab.NOTES));
    expect(result.current.navigationState).not.toHaveProperty(
      'timeseriesChart',
    );

    act(() => result.current.changeTimeseriesChart({ sig: 'ts:PI.1' }));
    act(() => result.current.clearSelectedAsset());
    expect(result.current.navigationState).not.toHaveProperty(
      'timeseriesChart',
    );
  });

  it('changes the search text and syncs it to the host', () => {
    const { result } = renderHook(() => useAssetNavigation(api), { wrapper });

    act(() => result.current.changeSearchQuery('pump'));

    expect(result.current.navigationState.searchQuery).toBe('pump');
    expect(api.syncInternalState).toHaveBeenCalledWith(
      JSON.stringify({
        selectedAsset: null,
        activeEquipmentTab: AssetEquipmentTab.PROPERTIES,
        searchQuery: 'pump',
      }),
    );
  });

  it('leaves a cleared search out of the state', () => {
    const initialState = JSON.stringify({ searchQuery: 'pump' });
    const { result } = renderHook(() => useAssetNavigation(api, initialState), {
      wrapper,
    });

    act(() => result.current.changeSearchQuery(''));

    expect(result.current.navigationState).not.toHaveProperty('searchQuery');
  });

  it('does not sync a search that did not change', () => {
    const initialState = JSON.stringify({ searchQuery: 'pump' });
    const { result } = renderHook(() => useAssetNavigation(api, initialState), {
      wrapper,
    });

    act(() => result.current.changeSearchQuery('pump'));

    expect(api.syncInternalState).not.toHaveBeenCalled();
  });

  it('keeps the search when an asset is opened and closed', () => {
    const initialState = JSON.stringify({ searchQuery: 'pump' });
    const { result } = renderHook(() => useAssetNavigation(api, initialState), {
      wrapper,
    });

    act(() => result.current.selectAsset(selectedAsset));
    act(() => result.current.clearSelectedAsset());

    expect(result.current.navigationState.searchQuery).toBe('pump');
  });

  it('clears the selection and syncs it to the host', () => {
    const initialState = JSON.stringify({ selectedAsset });
    const { result } = renderHook(() => useAssetNavigation(api, initialState), {
      wrapper,
    });

    act(() => result.current.clearSelectedAsset());

    expect(result.current.navigationState.selectedAsset).toBeNull();
    expect(api.syncInternalState).toHaveBeenCalledWith(
      JSON.stringify({
        selectedAsset: null,
        activeEquipmentTab: AssetEquipmentTab.PROPERTIES,
      }),
    );
  });

  it('still navigates before the host connection is available', () => {
    const { result } = renderHook(() => useAssetNavigation(null), { wrapper });

    act(() => result.current.selectAsset(selectedAsset));

    expect(result.current.navigationState.selectedAsset).toEqual(selectedAsset);
  });

  it('logs a failed sync to the console by default', async () => {
    const error = new Error('sync failed');
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    vi.mocked(api.syncInternalState).mockRejectedValue(error);
    const { result } = renderHook(() => useAssetNavigation(api));

    await act(async () => result.current.selectAsset(selectedAsset));

    expect(consoleError).toHaveBeenCalledWith(
      'Failed to sync asset register state.',
      error,
    );
  });

  it('logs a failed sync without losing the navigation', async () => {
    const error = new Error('sync failed');
    vi.mocked(api.syncInternalState).mockRejectedValue(error);
    const { result } = renderHook(() => useAssetNavigation(api), { wrapper });

    await act(async () => result.current.selectAsset(selectedAsset));

    expect(deps.logError).toHaveBeenCalledWith(
      'Failed to sync asset register state.',
      error,
    );
    expect(result.current.navigationState.selectedAsset).toEqual(selectedAsset);
  });
});
