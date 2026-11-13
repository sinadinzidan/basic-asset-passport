import type { AssetIdentifier, AssetListItem } from '../../../types/asset';
import { useNavigationState } from '../../general/useNavigationState';
import { useAssets } from '../useAssets';

const NO_ASSETS: AssetListItem[] = [];

export function useAssetTableViewModel() {
  const searchQuery = useNavigationState((store) => store.navigationState.searchQuery ?? '');
  const registerCursors = useNavigationState((store) => store.navigationState.registerCursors);
  const {
    changeSearchQuery,
    goToNextRegisterPage,
    goToPreviousRegisterPage,
    goToFirstRegisterPage,
    selectAsset,
  } = useNavigationState((store) => store.actions);
  const {
    data: assetPage,
    error,
    isError,
    isFetching,
    isPending,
    retry,
  } = useAssets(registerCursors?.[registerCursors.length - 1], searchQuery);

  const pageCursors = registerCursors ?? [];
  const isSearching = searchQuery !== '';
  const nextCursor = assetPage?.nextCursor ?? null;

  function goToNextPage(): void {
    if (nextCursor) goToNextRegisterPage(nextCursor);
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
    goToPreviousPage: goToPreviousRegisterPage,
    goToFirstPage: goToFirstRegisterPage,
    openAsset,
  };
}
