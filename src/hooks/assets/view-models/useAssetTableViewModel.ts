import type { AssetIdentifier, AssetListItem } from '../../../types/asset';
import { useNavigationState } from '../../general/useNavigationState';
import { useAssets } from '../useAssets';

const NO_ASSETS: AssetListItem[] = [];

export function useAssetTableViewModel() {
  const searchQuery = useNavigationState((store) => store.navigationState.searchQuery ?? '');
  const assetTableCursors = useNavigationState((store) => store.navigationState.assetTableCursors);
  const {
    changeSearchQuery,
    goToNextAssetTablePage,
    goToPreviousAssetTablePage,
    goToFirstAssetTablePage,
    selectAsset,
  } = useNavigationState((store) => store.actions);
  const {
    data: assetPage,
    error,
    isError,
    isFetching,
    isPending,
    retry,
  } = useAssets(assetTableCursors?.[assetTableCursors.length - 1], searchQuery);

  const pageCursors = assetTableCursors ?? [];
  const isSearching = searchQuery !== '';
  const nextCursor = assetPage?.nextCursor ?? null;

  function goToNextPage(): void {
    if (nextCursor) goToNextAssetTablePage(nextCursor);
  }

  function openAsset({ space, externalId }: AssetIdentifier): void {
    selectAsset({ space, externalId });
  }

  return {
    assets: assetPage?.items ?? NO_ASSETS,
    searchQuery,
    isSearching,
    isSearchTruncated: isSearching && assetPage?.hasMore === true,
    pageNumber: pageCursors.length + 1,
    isOnLaterPage: pageCursors.length > 0,
    hasNextPage: nextCursor !== null,
    error,
    isError,
    isFetching,
    isPending,
    retry,
    changeSearchQuery,
    goToNextPage,
    goToPreviousPage: goToPreviousAssetTablePage,
    goToFirstPage: goToFirstAssetTablePage,
    openAsset,
  };
}
