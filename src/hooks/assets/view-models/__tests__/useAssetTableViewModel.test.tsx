import { act, renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StoreApi } from 'zustand';

import { makeAssetListItem, makeAssetPage } from '../../../../__mocks__/assets';
import { makeMockClient } from '../../../../__mocks__/cogniteClient';
import { makeNavigationStore } from '../../../../__mocks__/navigation';
import { makeQueryClientWrapper } from '../../../../__mocks__/QueryClientWrapper';
import type { AssetService } from '../../../../services/assets/asset';
import type { NavigationState, NavigationStore } from '../../../../types/navigation';
import { NavigationStoreContext } from '../../../general/useNavigationState';
import { AssetContext } from '../../useAssetContext';
import { UseAssetsContext } from '../../useAssets';
import { useAssetTableViewModel } from '../useAssetTableViewModel';

describe(useAssetTableViewModel.name, () => {
  const client = makeMockClient();
  let assetService: AssetService;
  let store: StoreApi<NavigationStore>;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    assetService = {
      listAssets: vi.fn(() => Promise.resolve(makeAssetPage([makeAssetListItem()], 'cursor-2'))),
      searchAssets: vi.fn(() => Promise.resolve(makeAssetPage([makeAssetListItem()], null, true))),
    };
    const QueryWrapper = makeQueryClientWrapper();

    wrapper = ({ children }) => (
      <NavigationStoreContext.Provider value={store}>
        <UseAssetsContext.Provider value={{ createAssetService: () => assetService }}>
          <QueryWrapper>
            <AssetContext.Provider value={client}>{children}</AssetContext.Provider>
          </QueryWrapper>
        </UseAssetsContext.Provider>
      </NavigationStoreContext.Provider>
    );
  });

  function renderViewModel(navigationState: Partial<NavigationState> = {}) {
    store = makeNavigationStore(navigationState);

    return renderHook(() => useAssetTableViewModel(), { wrapper });
  }

  it('is pending with no assets until the first page arrives', async () => {
    const { result } = renderViewModel();

    expect(result.current.isPending).toBe(true);
    expect(result.current.assets).toEqual([]);
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it('gives the first page, its number and whether another follows', async () => {
    const { result } = renderViewModel();

    await waitFor(() => expect(result.current.assets).toEqual([makeAssetListItem()]));
    expect(result.current.pageNumber).toBe(1);
    expect(result.current.isOnLaterPage).toBe(false);
    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.isSearching).toBe(false);
  });

  it('reads the page of the last cursor and counts the pages before it', async () => {
    const { result } = renderViewModel({ registerCursors: ['cursor-2', 'cursor-3'] });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(assetService.listAssets).toHaveBeenCalledWith('cursor-3');
    expect(result.current.pageNumber).toBe(3);
    expect(result.current.isOnLaterPage).toBe(true);
  });

  it('goes to the next page with the cursor of the page on screen', async () => {
    const { result } = renderViewModel();

    await waitFor(() => expect(result.current.hasNextPage).toBe(true));

    act(() => result.current.goToNextPage());

    expect(store.getState().navigationState.registerCursors).toEqual(['cursor-2']);
  });

  it('searches instead of listing and says when the matches are cut short', async () => {
    const { result } = renderViewModel({ searchQuery: 'pump' });

    await waitFor(() => expect(result.current.isSearchTruncated).toBe(true));
    expect(assetService.searchAssets).toHaveBeenCalledWith('pump');
    expect(result.current.isSearching).toBe(true);
    expect(result.current.searchQuery).toBe('pump');
  });

  it('opens an asset by its identity only', async () => {
    const { result } = renderViewModel();

    await waitFor(() => expect(result.current.isPending).toBe(false));

    act(() => result.current.openAsset(makeAssetListItem({ space: 's', externalId: 'FLOC-7' })));

    expect(store.getState().navigationState.selectedAsset).toEqual({
      space: 's',
      externalId: 'FLOC-7',
    });
  });

  it('reports a failed load with its error and reads again on retry', async () => {
    vi.mocked(assetService.listAssets).mockRejectedValueOnce(new Error('no access'));
    const { result } = renderViewModel();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('no access'));

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.assets).toHaveLength(1));
  });
});
