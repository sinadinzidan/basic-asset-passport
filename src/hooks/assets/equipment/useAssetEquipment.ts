import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import { MODEL } from '../../../config/model';
import { ASSET_EQUIPMENT_QUERY_LIMIT, ASSET_QUERY_STALE_TIME_MS } from '../../../constants/assets';
import { isKeyOfList } from '../../../lib/queryKeys';
import { toQueryState } from '../../../lib/queryState';
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
    MODEL.space,
    MODEL.externalId,
    MODEL.version,
    MODEL.views.equipment,
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

  const query = useQuery({
    queryKey: [...listKey, limit],
    queryFn: () => equipmentService.listAssetEquipment(assetIdentifier, limit),
    staleTime: ASSET_QUERY_STALE_TIME_MS,
    placeholderData: (previousData, previousQuery) =>
      isKeyOfList(previousQuery?.queryKey, listKey) ? previousData : undefined,
  });

  return toQueryState(query);
}
