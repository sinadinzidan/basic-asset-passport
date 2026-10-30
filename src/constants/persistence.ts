import { AssetView } from '../enums/assetView';
import { PassportTab } from '../enums/passportTab';
import { ThemeMode } from '../enums/themeMode';

// The values already written to Fusion shared links and browser storage. They stay as they were, so existing
// links and saved choices keep working; the enums map to and from them at the storage boundary.
export const PASSPORT_TAB_STORED_VALUES: Record<PassportTab, string> = {
  [PassportTab.OVERVIEW]: 'overview',
  [PassportTab.DOCUMENTS]: 'documents',
};

export const ASSET_VIEW_STORED_VALUES: Record<AssetView, string> = {
  [AssetView.LIST]: 'list',
  [AssetView.GRID]: 'grid',
};

export const THEME_MODE_STORED_VALUES: Record<ThemeMode, string> = {
  [ThemeMode.LIGHT]: 'light',
  [ThemeMode.DARK]: 'dark',
};
