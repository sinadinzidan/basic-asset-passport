import { createStore, type StoreApi } from 'zustand/vanilla';

import { AppView } from '../enums/appView';
import { AssetTab } from '../enums/assetTab';
import { DEFAULT_NAVIGATION_STATE } from '../lib/navigationState';
import type { NavigationState, NavigationStore } from '../types/navigation';

type NavigationStoreOptions = {
  initialState?: NavigationState;
  onChange?: (navigationState: NavigationState) => void;
};

export function createNavigationStore({
  initialState = DEFAULT_NAVIGATION_STATE,
  onChange,
}: NavigationStoreOptions = {}): StoreApi<NavigationStore> {
  return createStore<NavigationStore>()((set, get) => {
    function update(patch: Partial<NavigationState>): void {
      const {
        timeseriesChart,
        searchQuery,
        assetTableCursors,
        isAssistantOpen,
        activeView,
        ...rest
      } = {
        ...get().navigationState,
        ...patch,
      };

      const navigationState: NavigationState = {
        ...rest,
        ...(activeView === AppView.THREE_D ? { activeView } : {}),
        ...(searchQuery ? { searchQuery } : {}),
        ...(timeseriesChart ? { timeseriesChart } : {}),
        ...(assetTableCursors && assetTableCursors.length > 0 ? { assetTableCursors } : {}),
        ...(isAssistantOpen ? { isAssistantOpen } : {}),
      };

      set({ navigationState });
      onChange?.(navigationState);
    }

    return {
      navigationState: initialState,
      actions: {
        changeSearchQuery: (searchQuery) => {
          if (searchQuery === (get().navigationState.searchQuery ?? '')) return;

          update({ searchQuery, assetTableCursors: undefined });
        },
        goToNextAssetTablePage: (nextCursor) =>
          update({
            assetTableCursors: [...(get().navigationState.assetTableCursors ?? []), nextCursor],
          }),
        goToPreviousAssetTablePage: () =>
          update({
            assetTableCursors: (get().navigationState.assetTableCursors ?? []).slice(0, -1),
          }),
        goToFirstAssetTablePage: () => update({ assetTableCursors: undefined }),
        selectAsset: (assetIdentifier) =>
          update({
            selectedAsset: assetIdentifier,
            activeAssetTab: AssetTab.PROPERTIES,
            timeseriesChart: undefined,
          }),
        clearSelectedAsset: () => update({ selectedAsset: null, timeseriesChart: undefined }),
        changeAppView: (activeView) => update({ activeView }),
        changeAssetTab: (activeAssetTab) => update({ activeAssetTab, timeseriesChart: undefined }),
        changeTimeseriesChart: (timeseriesChart) =>
          update({ timeseriesChart: timeseriesChart ?? undefined }),
        changeAssistantOpen: (isOpen) => {
          if (isOpen === Boolean(get().navigationState.isAssistantOpen)) return;

          update({ isAssistantOpen: isOpen });
        },
      },
    };
  });
}
