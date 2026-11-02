import { ASSET_PAGE_SIZE } from '../constants/assets';
import { AssetView } from '../enums/assetView';
import type { PassportTab } from '../enums/passportTab';
import type { AssetSelection, FileSelection } from '../types/asset';

import type { AppState } from './appState';

/**
 * Every way the user can move around the app, as pure functions from one state to the next. They hold the rules for what
 * each move keeps, resets and leaves out of the shared link (a default value is never written, so links stay short).
 */

function without(state: AppState, ...keys: (keyof AppState)[]): AppState {
  const next = { ...state };
  for (const key of keys) delete next[key];
  return next;
}

export function goHome(state: AppState): AppState {
  return without(state, 'selectedAsset', 'selectedFile', 'selectedEquipmentId', 'passportTab');
}

export function selectAsset(state: AppState, selectedAsset: AssetSelection): AppState {
  return { ...state, selectedAsset };
}

export function setPassportTab(state: AppState, passportTab: PassportTab): AppState {
  return { ...state, passportTab };
}

export function selectEquipment(state: AppState, selectedEquipmentId: string): AppState {
  return { ...state, selectedEquipmentId };
}

/** Opens a file preview, or closes it when no file is given. */
export function selectFile(state: AppState, selectedFile: FileSelection | undefined): AppState {
  const rest = without(state, 'selectedFile');
  return selectedFile ? { ...rest, selectedFile } : rest;
}

/** The list is the default view, so only the grid is kept. */
export function setView(state: AppState, view: AssetView | undefined): AppState {
  const rest = without(state, 'assetView');
  return view === AssetView.GRID ? { ...rest, assetView: AssetView.GRID } : rest;
}

/** A new search starts from the first page and leaves any selection behind; it keeps only how the list is displayed. */
export function setSearch(state: AppState, assetSearch: string): AppState {
  return {
    ...(state.assetPageSize ? { assetPageSize: state.assetPageSize } : {}),
    ...(state.assetView ? { assetView: state.assetView } : {}),
    ...(assetSearch ? { assetSearch } : {}),
  };
}

/** A new page size starts again from the first page; the default size is not written. */
export function setPageSize(state: AppState, assetPageSize: number): AppState {
  const rest = without(state, 'assetPage', 'assetPageSize');
  return assetPageSize === ASSET_PAGE_SIZE ? rest : { ...rest, assetPageSize };
}

/** The first page is the default and is not written. */
export function setPage(state: AppState, assetPage: number): AppState {
  const rest = without(state, 'assetPage');
  return assetPage > 0 ? { ...rest, assetPage } : rest;
}
