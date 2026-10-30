import { AssetView } from '../enums/assetView';
import { PassportTab } from '../enums/passportTab';

// Display text for each enum member, so raw enum values are never shown to users.
export const PASSPORT_TAB_LABELS: Record<PassportTab, string> = {
  [PassportTab.OVERVIEW]: 'Overview',
  [PassportTab.DOCUMENTS]: 'Documents',
};

export const ASSET_VIEW_LABELS: Record<AssetView, string> = {
  [AssetView.LIST]: 'List view',
  [AssetView.GRID]: 'Grid view',
};

export const NO_DESCRIPTION_LABEL = 'No description available.';
export const NO_EXTERNAL_ID_LABEL = 'No external ID';
/** Shown where a value is missing, so a gap reads the same everywhere. */
export const EMPTY_VALUE_LABEL = '—';
