import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import {
  ASSET_QUERY_STALE_TIME_MS,
  ASSET_VIEW_EXTERNAL_ID,
  ASSET_PASSPORT_MODEL_EXTERNAL_ID,
  ASSET_PASSPORT_MODEL_SPACE,
  ASSET_PASSPORT_MODEL_VERSION,
} from '../../constants/assets';
import { listAssets } from '../../services/assets/assetService';

import { useAssetDataClient } from './useAssetDataClient';

const defaultDeps = { useAssetDataClient, listAssets };

export type UseAssetsContextType = typeof defaultDeps;
export const UseAssetsContext =
  createContext<UseAssetsContextType>(defaultDeps);

export function useAssets(cursor?: string) {
  const { useAssetDataClient: useClient, listAssets: loadAssets } =
    useContext(UseAssetsContext);
  const client = useClient();

  return useQuery({
    queryKey: [
      'assets',
      client.project,
      ASSET_PASSPORT_MODEL_EXTERNAL_ID,
  ASSET_PASSPORT_MODEL_SPACE,
  ASSET_PASSPORT_MODEL_VERSION,
      ASSET_VIEW_EXTERNAL_ID,
      cursor,
    ],
    queryFn: () => loadAssets(client, cursor),
    staleTime: ASSET_QUERY_STALE_TIME_MS,
  });
}
