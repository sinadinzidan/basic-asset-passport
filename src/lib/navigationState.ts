import {
  AssetEquipmentTab,
  isAssetEquipmentTab,
} from '../enums/assetEquipmentTab';
import type { AssetIdentifier, AssetNavigationState } from '../types/asset';

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

    return {
      selectedAsset: isAssetIdentifier(parsed.selectedAsset)
        ? parsed.selectedAsset
        : null,
      activeEquipmentTab: isAssetEquipmentTab(parsed.activeEquipmentTab)
        ? parsed.activeEquipmentTab
        : AssetEquipmentTab.PROPERTIES,
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
