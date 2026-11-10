import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import {
  ASSET_QUERY_STALE_TIME_MS,
  ASSET_VIEW_EXTERNAL_ID,
  ASSET_PASSPORT_MODEL_EXTERNAL_ID,
  ASSET_PASSPORT_MODEL_SPACE,
  ASSET_PASSPORT_MODEL_VERSION,
} from '../../constants/assets';
import { listAssets, searchAssets } from '../../services/assets/assetService';

import { useAssetDataClient } from './useAssetDataClient';

const defaultDeps = { useAssetDataClient, listAssets, searchAssets };

export type UseAssetsContextType = typeof defaultDeps;
export const UseAssetsContext =
  createContext<UseAssetsContextType>(defaultDeps);

/**
 * One page of assets: the page after `cursor` of the whole register, or, when
 * there is search text, the assets matching it (which have no further pages).
 */
export function useAssets(cursor?: string, searchText: string = '') {
  const {
    useAssetDataClient: useClient,
    listAssets: loadAssets,
    searchAssets: findAssets,
  } = useContext(UseAssetsContext);
  const client = useClient();
  const searchQuery = searchText.trim();

  return useQuery({
    queryKey: [
      'assets',
      client.project,
      ASSET_PASSPORT_MODEL_EXTERNAL_ID,
      ASSET_PASSPORT_MODEL_SPACE,
      ASSET_PASSPORT_MODEL_VERSION,
      ASSET_VIEW_EXTERNAL_ID,
      cursor,
      searchQuery,
    ],
    queryFn: () =>
      searchQuery
        ? findAssets(client, searchQuery)
        : loadAssets(client, cursor),
    staleTime: ASSET_QUERY_STALE_TIME_MS,
  });
}
