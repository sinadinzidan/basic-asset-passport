import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import { MODEL } from '../../../config/model';
import { ASSET_EQUIPMENT_QUERY_LIMIT, ASSET_QUERY_STALE_TIME_MS } from '../../../constants/assets';
import { isKeyOfList } from '../../../lib/queryKeys';
import { toQueryState } from '../../../lib/queryState';
import { listAssetEquipment } from '../../../services/assets/assetEquipment';
import type { AssetIdentifier } from '../../../types/asset';
import { useAssetContext } from '../useAssetContext';

const defaultDeps = { listAssetEquipment };

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
  const { listAssetEquipment: loadEquipment } = useContext(UseAssetEquipmentContext);
  const client = useAssetContext();

  const listKey = getAssetEquipmentQueryKey(client.project, assetIdentifier);

  const query = useQuery({
    queryKey: [...listKey, limit],
    queryFn: () => loadEquipment(client, assetIdentifier, limit),
    staleTime: ASSET_QUERY_STALE_TIME_MS,
    placeholderData: (previousData, previousQuery) =>
      isKeyOfList(previousQuery?.queryKey, listKey) ? previousData : undefined,
  });

  return toQueryState(query);
}
