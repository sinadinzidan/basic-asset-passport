import { ASSET_PAGE_SIZE_OPTIONS, ASSET_SEARCH_MAX_LENGTH } from '../constants/assets';
import { ASSET_VIEW_STORED_VALUES, PASSPORT_TAB_STORED_VALUES } from '../constants/persistence';
import { AssetView } from '../enums/assetView';
import { PassportTab } from '../enums/passportTab';
import type { AssetSelection, FileSelection } from '../types/asset';

import { fromStoredValue } from './enumGuards';

export type AppState = {
  assetPage?: number;
  assetPageSize?: number;
  assetView?: AssetView;
  selectedEquipmentId?: string;
  assetSearch?: string;
  passportTab?: PassportTab;
  selectedAsset?: AssetSelection;
  selectedFile?: FileSelection;
};

export function parseInitialState(initialState: string | undefined): AppState {
  if (!initialState) return {};

  try {
    const value: unknown = JSON.parse(initialState);
    if (typeof value !== 'object' || value === null) return {};
    const state: AppState = {};
    const passportTab = 'passportTab' in value ? fromStoredValue(PassportTab, PASSPORT_TAB_STORED_VALUES, value.passportTab) : undefined;
    if (passportTab !== undefined) state.passportTab = passportTab;
    if ('assetSearch' in value && typeof value.assetSearch === 'string'
      && value.assetSearch.trim().length > 0 && value.assetSearch.length <= ASSET_SEARCH_MAX_LENGTH) {
      state.assetSearch = value.assetSearch.trim();
    }
    if ('assetPageSize' in value && typeof value.assetPageSize === 'number' && ASSET_PAGE_SIZE_OPTIONS.some((option) => option === value.assetPageSize)) {
      state.assetPageSize = value.assetPageSize;
    }
    if ('selectedEquipmentId' in value && typeof value.selectedEquipmentId === 'string' && value.selectedEquipmentId.length > 0) {
      state.selectedEquipmentId = value.selectedEquipmentId;
    }
    const assetView = 'assetView' in value ? fromStoredValue(AssetView, ASSET_VIEW_STORED_VALUES, value.assetView) : undefined;
    if (assetView === AssetView.GRID) state.assetView = assetView;
    if ('assetPage' in value && typeof value.assetPage === 'number' && Number.isSafeInteger(value.assetPage) && value.assetPage >= 0) {
      state.assetPage = value.assetPage;
    }
    if (
      'selectedAsset' in value &&
      typeof value.selectedAsset === 'object' &&
      value.selectedAsset !== null &&
      'space' in value.selectedAsset &&
      typeof value.selectedAsset.space === 'string' &&
      value.selectedAsset.space.length > 0 &&
      'externalId' in value.selectedAsset &&
      typeof value.selectedAsset.externalId === 'string' &&
      value.selectedAsset.externalId.length > 0 &&
      'name' in value.selectedAsset &&
      typeof value.selectedAsset.name === 'string'
    ) {
      state.selectedAsset = {
        space: value.selectedAsset.space,
        externalId: value.selectedAsset.externalId,
        // A blank saved name would leave the breadcrumb and page title empty.
        name: value.selectedAsset.name.trim() || value.selectedAsset.externalId,
      };
    }
    if (
      state.selectedAsset &&
      'selectedFile' in value &&
      typeof value.selectedFile === 'object' &&
      value.selectedFile !== null &&
      'space' in value.selectedFile &&
      typeof value.selectedFile.space === 'string' &&
      value.selectedFile.space.length > 0 &&
      'externalId' in value.selectedFile &&
      typeof value.selectedFile.externalId === 'string' &&
      value.selectedFile.externalId.length > 0 &&
      'name' in value.selectedFile &&
      typeof value.selectedFile.name === 'string'
    ) {
      state.selectedFile = {
        space: value.selectedFile.space,
        externalId: value.selectedFile.externalId,
        name: value.selectedFile.name.trim() || value.selectedFile.externalId,
      };
    }
    return state;
  } catch {
    return {};
  }

  return {};
}

/** Writes the state for the Fusion shared link, using the stored values rather than the enum members. */
export function serializeAppState(state: AppState): string {
  return JSON.stringify({
    ...state,
    ...(state.passportTab === undefined ? {} : { passportTab: PASSPORT_TAB_STORED_VALUES[state.passportTab] }),
    ...(state.assetView === undefined ? {} : { assetView: ASSET_VIEW_STORED_VALUES[state.assetView] }),
  });
}
