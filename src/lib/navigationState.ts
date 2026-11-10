import {
  AssetEquipmentTab,
  isAssetEquipmentTab,
} from '../enums/assetEquipmentTab';
import type {
  AssetIdentifier,
  AssetNavigationState,
  TimeseriesChartOptions,
} from '../types/asset';

export const DEFAULT_NAVIGATION_STATE: AssetNavigationState = {
  selectedAsset: null,
  activeEquipmentTab: AssetEquipmentTab.PROPERTIES,
};

export function parseNavigationState(
  initialState: string | undefined,
): AssetNavigationState {
  if (!initialState) return DEFAULT_NAVIGATION_STATE;

  try {
    const parsed: unknown = JSON.parse(initialState);
    if (!isRecord(parsed)) return DEFAULT_NAVIGATION_STATE;

    const selectedAsset = isAssetIdentifier(parsed.selectedAsset)
      ? parsed.selectedAsset
      : null;

    const searchQuery =
      typeof parsed.searchQuery === 'string' ? parsed.searchQuery.trim() : '';

    return {
      selectedAsset,
      activeEquipmentTab: isAssetEquipmentTab(parsed.activeEquipmentTab)
        ? parsed.activeEquipmentTab
        : AssetEquipmentTab.PROPERTIES,
      ...(searchQuery ? { searchQuery } : {}),
      // A chart belongs to the open asset, so it is only restored with one.
      ...(selectedAsset && isChartOptions(parsed.timeseriesChart)
        ? { timeseriesChart: parsed.timeseriesChart }
        : {}),
    };
  } catch {
    return DEFAULT_NAVIGATION_STATE;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAssetIdentifier(value: unknown): value is AssetIdentifier {
  return (
    isRecord(value) &&
    typeof value.space === 'string' &&
    typeof value.externalId === 'string'
  );
}

function isChartOptions(value: unknown): value is TimeseriesChartOptions {
  return (
    isRecord(value) &&
    Object.keys(value).length > 0 &&
    Object.values(value).every((entry) => typeof entry === 'string')
  );
}
