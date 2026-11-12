import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import { MODEL } from '../../config/model';
import { ASSET_QUERY_STALE_TIME_MS } from '../../constants/assets';
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
      MODEL.externalId,
      MODEL.space,
      MODEL.version,
      MODEL.views.asset,
      pageCursor,
      searchQuery,
    ],
    queryFn: () => (searchQuery ? findAssets(client, searchQuery) : loadAssets(client, pageCursor)),
    staleTime: ASSET_QUERY_STALE_TIME_MS,
  });
}
