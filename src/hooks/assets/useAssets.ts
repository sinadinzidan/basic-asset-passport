import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import { MODEL } from '../../config/model';
import { ASSET_QUERY_STALE_TIME_MS } from '../../constants/assets';
import { toQueryState } from '../../lib/queryState';
import { createAssetService } from '../../services/assets/asset';

import { useAssetClient } from './useAssetClient';

const defaultDeps = { createAssetService };

export type UseAssetsContextType = typeof defaultDeps;
export const UseAssetsContext = createContext<UseAssetsContextType>(defaultDeps);

export function useAssets(cursor?: string, searchText: string = '') {
  const { createAssetService } = useContext(UseAssetsContext);
  const client = useAssetClient();
  const assetService = createAssetService(client);

  const searchQuery = searchText.trim();
  const pageCursor = searchQuery ? undefined : cursor;

  const query = useQuery({
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
    queryFn: () =>
      searchQuery ? assetService.searchAssets(searchQuery) : assetService.listAssets(pageCursor),
    staleTime: ASSET_QUERY_STALE_TIME_MS,
  });

  return toQueryState(query);
}
