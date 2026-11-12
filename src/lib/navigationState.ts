import { AssetTab } from '../enums/assetTab';
import { NavigationStateSchema } from '../schemas/navigation';
import type { NavigationState } from '../types/navigation';

export const DEFAULT_NAVIGATION_STATE: NavigationState = {
  selectedAsset: null,
  activeAssetTab: AssetTab.PROPERTIES,
};

export function parseNavigationState(initialState: string | undefined): NavigationState {
  if (!initialState) return DEFAULT_NAVIGATION_STATE;

  const parsed = NavigationStateSchema.safeParse(readJson(initialState));
  if (!parsed.success) return DEFAULT_NAVIGATION_STATE;

  const { selectedAsset, activeAssetTab, searchQuery, registerCursors, timeseriesChart } =
    parsed.data;

  return {
    selectedAsset,
    activeAssetTab,
    ...(searchQuery ? { searchQuery } : {}),
    ...(selectedAsset && timeseriesChart ? { timeseriesChart } : {}),
    ...(!searchQuery && registerCursors.length > 0 ? { registerCursors } : {}),
    ...(parsed.data.isAssistantOpen ? { isAssistantOpen: true } : {}),
  };
}

function readJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
