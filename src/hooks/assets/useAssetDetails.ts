import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import {
  ASSET_QUERY_STALE_TIME_MS,
  ASSET_VIEW_EXTERNAL_ID,
  ASSET_PASSPORT_MODEL_EXTERNAL_ID,
  ASSET_PASSPORT_MODEL_SPACE,
  ASSET_PASSPORT_MODEL_VERSION,
} from '../../constants/assets';
import { createAssetDetailsService } from '../../services/assets/assetDetails';
import type { AssetIdentifier } from '../../types/asset';

import { useAssetContext } from './useAssetContext';

const defaultDeps = { createAssetDetailsService };

export type UseAssetDetailsContextType = typeof defaultDeps;
export const UseAssetDetailsContext = createContext<UseAssetDetailsContextType>(defaultDeps);

export function useAssetDetails(assetIdentifier: AssetIdentifier) {
  const { createAssetDetailsService } = useContext(UseAssetDetailsContext);
  const client = useAssetContext();
  const detailsService = createAssetDetailsService(client);

  return useQuery({
    queryKey: [
      'asset-details',
      client.project,
      ASSET_PASSPORT_MODEL_EXTERNAL_ID,
      ASSET_PASSPORT_MODEL_SPACE,
      ASSET_PASSPORT_MODEL_VERSION,
      ASSET_VIEW_EXTERNAL_ID,
      assetIdentifier.space,
      assetIdentifier.externalId,
    ],
    queryFn: () => detailsService.getAssetDetails(assetIdentifier),
    staleTime: ASSET_QUERY_STALE_TIME_MS,
  });
}
