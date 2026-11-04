import { useCogniteSdk } from '@cognite/app-sdk/react';
import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import {
  ASSET_QUERY_STALE_TIME_MS,
  ASSET_VIEW_EXTERNAL_ID,
  ASSET_VIEW_SPACE,
} from '../../constants/assets';
import { listAssets } from '../../services/assets/assetService';

const defaultDeps = { useCogniteSdk, listAssets };

export type UseAssetsContextType = typeof defaultDeps;
export const UseAssetsContext =
  createContext<UseAssetsContextType>(defaultDeps);

export function useAssets(cursor?: string) {
  const { useCogniteSdk: useClient, listAssets: loadAssets } =
    useContext(UseAssetsContext);
  const client = useClient();

  return useQuery({
    queryKey: [
      'assets',
      client.project,
      ASSET_VIEW_SPACE,
      ASSET_VIEW_EXTERNAL_ID,
      cursor,
    ],
    queryFn: () => loadAssets(client, cursor),
    staleTime: ASSET_QUERY_STALE_TIME_MS,
  });
}
