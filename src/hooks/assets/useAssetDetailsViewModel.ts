import { MODEL } from '../../config/model';
import { getPropertyValue } from '../../lib/assetProperties';
import type { AssetIdentifier } from '../../types/asset';

import { useAssetDetails } from './useAssetDetails';
import { useAssetDetailsTabCounts } from './useAssetDetailsTabCounts';

export function useAssetDetailsViewModel(assetIdentifier: AssetIdentifier) {
  const {
    data: asset,
    error,
    isError,
    isFetching,
    isPending,
    refetch,
  } = useAssetDetails(assetIdentifier);
  const tabCounts = useAssetDetailsTabCounts(assetIdentifier);

  function retry(): void {
    void refetch();
  }

  return {
    asset,
    title: getPropertyValue(asset, MODEL.properties.asset.name) ?? assetIdentifier.externalId,
    status: getPropertyValue(asset, MODEL.properties.asset.status),
    criticality: getPropertyValue(asset, MODEL.properties.asset.criticality),
    tabCounts,
    error,
    isError,
    isFetching,
    isPending,
    retry,
  };
}
