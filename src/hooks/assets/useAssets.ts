import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import {
  ASSET_QUERY_STALE_TIME_MS,
  ASSET_VIEW_EXTERNAL_ID,
  ASSET_PASSPORT_MODEL_EXTERNAL_ID,
  ASSET_PASSPORT_MODEL_SPACE,
  ASSET_PASSPORT_MODEL_VERSION,
} from '../../constants/assets';
import { listAssets, searchAssets } from '../../services/assets/asset';

import { useAssetContext } from './useAssetContext';

const defaultDeps = { listAssets, searchAssets };

export type UseAssetsContextType = typeof defaultDeps;
export const UseAssetsContext = createContext<UseAssetsContextType>(defaultDeps);

export function useAssets(cursor?: string, searchText: string = '') {
  const { listAssets: loadAssets, searchAssets: findAssets } = useContext(UseAssetsContext);
  const client = useAssetContext();

  const searchQuery = searchText.trim();
  const pageCursor = searchQuery ? undefined : cursor;

  return useQuery({
    queryKey: [
      'assets',
      client.project,
      ASSET_PASSPORT_MODEL_EXTERNAL_ID,
      ASSET_PASSPORT_MODEL_SPACE,
      ASSET_PASSPORT_MODEL_VERSION,
      ASSET_VIEW_EXTERNAL_ID,
      pageCursor,
      searchQuery,
    ],
    queryFn: () => (searchQuery ? findAssets(client, searchQuery) : loadAssets(client, pageCursor)),
    staleTime: ASSET_QUERY_STALE_TIME_MS,
  });
}
