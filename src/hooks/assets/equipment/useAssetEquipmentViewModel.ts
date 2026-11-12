import type { AssetIdentifier, AssetInstanceDetails } from '../../../types/asset';

import { useAssetEquipment } from './useAssetEquipment';

const NO_EQUIPMENT: AssetInstanceDetails[] = [];

export function useAssetEquipmentViewModel(assetIdentifier: AssetIdentifier) {
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
