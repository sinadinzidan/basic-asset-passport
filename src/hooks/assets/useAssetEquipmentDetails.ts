import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import {
  ASSET_QUERY_STALE_TIME_MS,
  ASSET_VIEW_EXTERNAL_ID,
  ASSET_VIEW_SPACE,
  EQUIPMENT_VIEW_EXTERNAL_ID,
} from '../../constants/assets';
import { getAssetEquipmentDetails } from '../../services/assets/assetDetailsService';
import type { AssetIdentifier } from '../../types/asset';

import { useAssetDataClient } from './useAssetDataClient';

const defaultDeps = { useAssetDataClient, getAssetEquipmentDetails };

export type UseAssetEquipmentDetailsContextType = typeof defaultDeps;
export const UseAssetEquipmentDetailsContext =
  createContext<UseAssetEquipmentDetailsContextType>(defaultDeps);

export function useAssetEquipmentDetails(assetIdentifier: AssetIdentifier) {
  const {
    useAssetDataClient: useClient,
    getAssetEquipmentDetails: loadDetails,
  } = useContext(UseAssetEquipmentDetailsContext);
  const client = useClient();

  return useQuery({
    queryKey: [
      'asset-equipment',
      client.project,
      ASSET_VIEW_SPACE,
      ASSET_VIEW_EXTERNAL_ID,
      EQUIPMENT_VIEW_EXTERNAL_ID,
      assetIdentifier.space,
      assetIdentifier.externalId,
    ],
    queryFn: () => loadDetails(client, assetIdentifier),
    staleTime: ASSET_QUERY_STALE_TIME_MS,
  });
}
