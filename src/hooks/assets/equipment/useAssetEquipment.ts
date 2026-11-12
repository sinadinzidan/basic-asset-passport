import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import {
  ASSET_EQUIPMENT_QUERY_LIMIT,
  ASSET_PASSPORT_MODEL_EXTERNAL_ID,
  ASSET_PASSPORT_MODEL_SPACE,
  ASSET_PASSPORT_MODEL_VERSION,
  ASSET_QUERY_STALE_TIME_MS,
  EQUIPMENT_VIEW_EXTERNAL_ID,
} from '../../../constants/assets';
import { isKeyOfList } from '../../../lib/queryKeys';
import { createAssetEquipmentService } from '../../../services/assets/assetEquipment';
import type { AssetIdentifier } from '../../../types/asset';
import { useAssetContext } from '../useAssetContext';

const defaultDeps = { createAssetEquipmentService };

export type UseAssetEquipmentContextType = typeof defaultDeps;
export const UseAssetEquipmentContext = createContext<UseAssetEquipmentContextType>(defaultDeps);

export function getAssetEquipmentQueryKey(project: string, assetIdentifier: AssetIdentifier) {
  return [
    'asset-equipment',
    project,
    ASSET_PASSPORT_MODEL_SPACE,
    ASSET_PASSPORT_MODEL_EXTERNAL_ID,
    ASSET_PASSPORT_MODEL_VERSION,
    EQUIPMENT_VIEW_EXTERNAL_ID,
    assetIdentifier.space,
    assetIdentifier.externalId,
  ];
}

export function useAssetEquipment(
  assetIdentifier: AssetIdentifier,
  limit: number = ASSET_EQUIPMENT_QUERY_LIMIT,
) {
  const { createAssetEquipmentService } = useContext(UseAssetEquipmentContext);
  const client = useAssetContext();
  const equipmentService = createAssetEquipmentService(client);

  const listKey = getAssetEquipmentQueryKey(client.project, assetIdentifier);

  return useQuery({
    queryKey: [...listKey, limit],
    queryFn: () => equipmentService.listAssetEquipment(assetIdentifier, limit),
    staleTime: ASSET_QUERY_STALE_TIME_MS,
    placeholderData: (previousData, previousQuery) =>
      isKeyOfList(previousQuery?.queryKey, listKey) ? previousData : undefined,
  });
}
