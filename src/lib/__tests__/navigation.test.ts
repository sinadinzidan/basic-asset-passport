import { describe, expect, it } from 'vitest';

import { ASSET_PAGE_SIZE } from '../../constants/assets';
import { AssetView } from '../../enums/assetView';
import { PassportTab } from '../../enums/passportTab';
import type { AppState } from '../appState';
import { goHome, selectAsset, selectEquipment, selectFile, setPage, setPageSize, setPassportTab, setSearch, setView } from '../navigation';

const asset = { space: 'energy', externalId: 'A-1', name: 'Feed pump' };
const file = { space: 'energy', externalId: 'F-1', name: 'Datasheet.pdf' };

describe('navigation', () => {
  it('goes home by clearing the asset page but keeping how the list is shown', () => {
    const state: AppState = { assetSearch: 'pump', assetView: AssetView.GRID, assetPage: 2, selectedAsset: asset, selectedFile: file, selectedEquipmentId: 'E-1', passportTab: PassportTab.DOCUMENTS };
    expect(goHome(state)).toEqual({ assetSearch: 'pump', assetView: AssetView.GRID, assetPage: 2 });
  });

  it('selects an asset, a tab and an equipment item without losing the rest', () => {
    expect(selectEquipment(setPassportTab(selectAsset({ assetPage: 1 }, asset), PassportTab.DOCUMENTS), 'E-2'))
      .toEqual({ assetPage: 1, selectedAsset: asset, passportTab: PassportTab.DOCUMENTS, selectedEquipmentId: 'E-2' });
  });

  it('opens a file preview and closes it again', () => {
    const open = selectFile({ selectedAsset: asset }, file);
    expect(open).toEqual({ selectedAsset: asset, selectedFile: file });
    expect(selectFile(open, undefined)).toEqual({ selectedAsset: asset });
  });

  it('keeps only the grid view, since the list is the default', () => {
    expect(setView({ assetPage: 1 }, AssetView.GRID)).toEqual({ assetPage: 1, assetView: AssetView.GRID });
    expect(setView({ assetView: AssetView.GRID }, AssetView.LIST)).toEqual({});
    expect(setView({ assetView: AssetView.GRID }, undefined)).toEqual({});
  });

  it('starts a search from the first page and leaves a selection behind, keeping the display choices', () => {
    const state: AppState = { assetPage: 3, assetPageSize: 25, assetView: AssetView.GRID, assetSearch: 'old', selectedAsset: asset };
    expect(setSearch(state, 'pump')).toEqual({ assetPageSize: 25, assetView: AssetView.GRID, assetSearch: 'pump' });
    expect(setSearch(state, '')).toEqual({ assetPageSize: 25, assetView: AssetView.GRID });
  });

  it('starts again from the first page for a new size, and does not write the default size', () => {
    expect(setPageSize({ assetPage: 4, assetSearch: 'pump' }, 25)).toEqual({ assetSearch: 'pump', assetPageSize: 25 });
    expect(setPageSize({ assetPage: 4, assetPageSize: 25 }, ASSET_PAGE_SIZE)).toEqual({});
  });

  it('does not write the first page', () => {
    expect(setPage({ assetSearch: 'pump' }, 2)).toEqual({ assetSearch: 'pump', assetPage: 2 });
    expect(setPage({ assetPage: 2 }, 0)).toEqual({});
  });

  it('never changes the state it was given', () => {
    const state: AppState = { assetPage: 2, selectedFile: file };
    goHome(state);
    selectFile(state, undefined);
    setPage(state, 0);
    expect(state).toEqual({ assetPage: 2, selectedFile: file });
  });
});
