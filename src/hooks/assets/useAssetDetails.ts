import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import {
  ASSET_QUERY_STALE_TIME_MS,
  ASSET_VIEW_EXTERNAL_ID,
  ASSET_PASSPORT_MODEL_EXTERNAL_ID,
  ASSET_PASSPORT_MODEL_SPACE,
  ASSET_PASSPORT_MODEL_VERSION,
} from '../../constants/assets';
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
      ASSET_PASSPORT_MODEL_EXTERNAL_ID,
      ASSET_PASSPORT_MODEL_SPACE,
      ASSET_PASSPORT_MODEL_VERSION,
      ASSET_VIEW_EXTERNAL_ID,
      assetIdentifier.space,
      assetIdentifier.externalId,
    ],
    queryFn: () => loadDetails(client, assetIdentifier),
    staleTime: ASSET_QUERY_STALE_TIME_MS,
  });
}
