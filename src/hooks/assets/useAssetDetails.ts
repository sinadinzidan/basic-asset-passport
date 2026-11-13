import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import { MODEL } from '../../config/model';
import { ASSET_QUERY_STALE_TIME_MS } from '../../constants/assets';
import { toQueryState } from '../../lib/queryState';
import { createAssetDetailsService } from '../../services/assets/assetDetails';
import type { AssetIdentifier } from '../../types/asset';

import { useAssetClient } from './useAssetClient';

const defaultDeps = { createAssetDetailsService };

export type UseAssetDetailsContextType = typeof defaultDeps;
export const UseAssetDetailsContext = createContext<UseAssetDetailsContextType>(defaultDeps);

export function useAssetDetails(assetIdentifier: AssetIdentifier) {
  const { createAssetDetailsService } = useContext(UseAssetDetailsContext);
  const client = useAssetClient();
  const detailsService = createAssetDetailsService(client);

  const query = useQuery({
    queryKey: [
      'asset-details',
      client.project,
      MODEL.externalId,
      MODEL.space,
      MODEL.version,
      MODEL.views.asset,
      assetIdentifier.space,
      assetIdentifier.externalId,
    ],
    queryFn: () => detailsService.getAssetDetails(assetIdentifier),
    staleTime: ASSET_QUERY_STALE_TIME_MS,
  });

  return toQueryState(query);
}
