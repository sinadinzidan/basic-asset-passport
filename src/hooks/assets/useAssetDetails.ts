import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import { MODEL } from '../../config/model';
import { ASSET_QUERY_STALE_TIME_MS } from '../../constants/assets';
import { getAssetDetails } from '../../services/assets/assetDetails';
import type { AssetIdentifier } from '../../types/asset';

import { useAssetContext } from './useAssetContext';

const defaultDeps = { getAssetDetails };

export type UseAssetDetailsContextType = typeof defaultDeps;
export const UseAssetDetailsContext = createContext<UseAssetDetailsContextType>(defaultDeps);

export function useAssetDetails(assetIdentifier: AssetIdentifier) {
  const { getAssetDetails: loadDetails } = useContext(UseAssetDetailsContext);
  const client = useAssetContext();

  return useQuery({
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
    queryFn: () => loadDetails(client, assetIdentifier),
    staleTime: ASSET_QUERY_STALE_TIME_MS,
  });
}
