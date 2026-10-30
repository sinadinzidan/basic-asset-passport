import { createContext, useContext } from 'react';

import type { AssetRecord } from '../../types/asset';

import { useAssetList } from './useAssetList';

const defaultDeps = { useAssetList };
export type AssetListViewModelContextType = typeof defaultDeps;
export const AssetListViewModelContext = createContext<AssetListViewModelContextType>(defaultDeps);

export interface AssetListViewModel {
  assets: AssetRecord[];
  isLoading: boolean;
  isFetching: boolean;
  errorMessage?: string;
  hasNextPage: boolean;
  isSearchLimited: boolean;
  hasNoMatches: boolean;
  retry: () => void;
}

export function useAssetListViewModel(page: number, search: string, pageSize?: number): AssetListViewModel {
  const { useAssetList } = useContext(AssetListViewModelContext);
  const { data, isLoading, isFetching, error, refetch } = useAssetList(page, search, pageSize);

  const assets = data?.items ?? [];

  return {
    assets,
    isLoading,
    isFetching,
    errorMessage: error?.message,
    hasNextPage: data?.hasMore ?? Boolean(data?.nextCursor && Object.keys(data.nextCursor).length > 0),
    isSearchLimited: Boolean(data?.isSearchLimited),
    hasNoMatches: Boolean(search) && data?.items.length === 0,
    retry: () => void refetch(),
  };
}
