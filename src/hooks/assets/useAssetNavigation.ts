import { createContext, useContext, useState } from 'react';

import { AssetEquipmentTab } from '../../enums/assetEquipmentTab';
import { parseNavigationState } from '../../lib/navigationState';
import type {
  AssetIdentifier,
  AssetNavigationState,
  TimeseriesChartOptions,
} from '../../types/asset';
import type { StateSyncApi } from '../../types/host';

export type AssetNavigationDeps = {
  logError: (message: string, error: unknown) => void;
};

const defaultDeps: AssetNavigationDeps = {
  logError: (message, error) => console.error(message, error),
};

export const AssetNavigationContext =
  createContext<AssetNavigationDeps>(defaultDeps);

export function useAssetNavigation(
  api: StateSyncApi | null,
  initialState?: string,
) {
  const { logError } = useContext(AssetNavigationContext);

  const [navigationState, setNavigationState] = useState<AssetNavigationState>(
    () => parseNavigationState(initialState),
  );

  function updateNavigationState(patch: Partial<AssetNavigationState>): void {
    const { timeseriesChart, searchQuery, ...rest } = {
      ...navigationState,
      ...patch,
    };
    // A closed chart and an empty search are left out of the state rather than stored as undefined.
    const nextState: AssetNavigationState = {
      ...rest,
      ...(searchQuery ? { searchQuery } : {}),
      ...(timeseriesChart ? { timeseriesChart } : {}),
    };
    setNavigationState(nextState);

    if (!api) return;

    void api
      .syncInternalState(JSON.stringify(nextState))
      .catch((error: unknown) => {
        logError('Failed to sync asset register state.', error);
      });
  }

  /** Searches the register for this text, or lists every asset when it is empty. */
  function changeSearchQuery(searchQuery: string): void {
    if (searchQuery === (navigationState.searchQuery ?? '')) return;
    updateNavigationState({ searchQuery });
  }

  function selectAsset(assetIdentifier: AssetIdentifier): void {
    updateNavigationState({
      selectedAsset: assetIdentifier,
      activeEquipmentTab: AssetEquipmentTab.PROPERTIES,
      timeseriesChart: undefined,
    });
  }

  function clearSelectedAsset(): void {
    updateNavigationState({ selectedAsset: null, timeseriesChart: undefined });
  }

  function changeEquipmentTab(activeEquipmentTab: AssetEquipmentTab): void {
    updateNavigationState({ activeEquipmentTab, timeseriesChart: undefined });
  }

  /** Opens the chart with this setup, or closes it when given none. */
  function changeTimeseriesChart(
    timeseriesChart: TimeseriesChartOptions | null,
  ): void {
    updateNavigationState({ timeseriesChart: timeseriesChart ?? undefined });
  }

  return {
    navigationState,
    changeSearchQuery,
    selectAsset,
    clearSelectedAsset,
    changeEquipmentTab,
    changeTimeseriesChart,
  };
}
