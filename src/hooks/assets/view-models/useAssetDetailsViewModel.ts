import { MODEL } from '../../../config/model';
import { getPropertyValue } from '../../../lib/assetProperties';
import { useAssetDetails } from '../useAssetDetails';
import { useAssetDetailsTabCounts } from '../useAssetDetailsTabCounts';
import { useSelectedAsset } from '../useSelectedAsset';

export function useAssetDetailsViewModel() {
  const assetIdentifier = useSelectedAsset();
  const {
    data: asset,
    error,
    isError,
    isFetching,
    isPending,
    retry,
  } = useAssetDetails(assetIdentifier);
  const tabCounts = useAssetDetailsTabCounts(assetIdentifier);

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
