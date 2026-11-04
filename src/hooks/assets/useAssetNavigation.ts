import { createContext, useContext, useState } from 'react';

import { AssetEquipmentTab } from '../../enums/assetEquipmentTab';
import { parseNavigationState } from '../../lib/navigationState';
import type { AssetIdentifier, AssetNavigationState } from '../../types/asset';
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
    const nextState = { ...navigationState, ...patch };
    setNavigationState(nextState);

    if (!api) return;

    void api
      .syncInternalState(JSON.stringify(nextState))
      .catch((error: unknown) => {
        logError('Failed to sync asset register state.', error);
      });
  }

  function selectAsset(assetIdentifier: AssetIdentifier): void {
    updateNavigationState({
      selectedAsset: assetIdentifier,
      activeEquipmentTab: AssetEquipmentTab.PROPERTIES,
    });
  }

  function clearSelectedAsset(): void {
    updateNavigationState({ selectedAsset: null });
  }

  function changeEquipmentTab(activeEquipmentTab: AssetEquipmentTab): void {
    updateNavigationState({ activeEquipmentTab });
  }

  return {
    navigationState,
    selectAsset,
    clearSelectedAsset,
    changeEquipmentTab,
  };
}
