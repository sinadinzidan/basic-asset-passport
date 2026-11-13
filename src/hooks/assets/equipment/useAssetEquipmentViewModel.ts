import type { AssetInstanceDetails } from '../../../types/asset';
import { useSelectedAsset } from '../useSelectedAsset';

import { useAssetEquipment } from './useAssetEquipment';

const NO_EQUIPMENT: AssetInstanceDetails[] = [];

export function useAssetEquipmentViewModel() {
  const assetIdentifier = useSelectedAsset();
  const { data, error, isError, isFetching, isPending, retry } = useAssetEquipment(assetIdentifier);

  return {
    equipment: data?.items ?? NO_EQUIPMENT,
    hasMore: data?.hasMore ?? false,
    error,
    isError,
    isFetching,
    isPending,
    retry,
  };
}
