import { AssetTab, isAssetTab } from '../enums/assetTab';
import type { AssetIdentifier, TimeseriesChartOptions } from '../types/asset';
import type { NavigationState } from '../types/navigation';

import { isRecord } from './isRecord';

export const DEFAULT_NAVIGATION_STATE: NavigationState = {
  selectedAsset: null,
  activeAssetTab: AssetTab.PROPERTIES,
};

export function parseNavigationState(initialState: string | undefined): NavigationState {
  if (!initialState) return DEFAULT_NAVIGATION_STATE;

  try {
    const parsed: unknown = JSON.parse(initialState);
    if (!isRecord(parsed)) return DEFAULT_NAVIGATION_STATE;

    const selectedAsset = isAssetIdentifier(parsed.selectedAsset) ? parsed.selectedAsset : null;

    const searchQuery = typeof parsed.searchQuery === 'string' ? parsed.searchQuery.trim() : '';

    const registerCursors =
      !searchQuery && isCursorTrail(parsed.registerCursors) ? parsed.registerCursors : [];

    return {
      selectedAsset,
      activeAssetTab: isAssetTab(parsed.activeAssetTab)
        ? parsed.activeAssetTab
        : AssetTab.PROPERTIES,
      ...(searchQuery ? { searchQuery } : {}),

      ...(selectedAsset && isChartOptions(parsed.timeseriesChart)
        ? { timeseriesChart: parsed.timeseriesChart }
        : {}),
      ...(registerCursors.length > 0 ? { registerCursors } : {}),
      ...(parsed.isAssistantOpen === true ? { isAssistantOpen: true } : {}),
    };
  } catch {
    return DEFAULT_NAVIGATION_STATE;
  }
}

function isAssetIdentifier(value: unknown): value is AssetIdentifier {
  return isRecord(value) && typeof value.space === 'string' && typeof value.externalId === 'string';
}

function isCursorTrail(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((cursor) => typeof cursor === 'string' && cursor !== '')
  );
}

function isChartOptions(value: unknown): value is TimeseriesChartOptions {
  return (
    isRecord(value) &&
    Object.keys(value).length > 0 &&
    Object.values(value).every((entry) => typeof entry === 'string')
  );
}
