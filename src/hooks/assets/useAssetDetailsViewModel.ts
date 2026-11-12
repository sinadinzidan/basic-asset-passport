import {
  CRITICALITY_PROPERTY_IDENTIFIER,
  NAME_PROPERTY_IDENTIFIER,
  STATUS_PROPERTY_IDENTIFIER,
} from '../../constants/assets';
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
    title: getPropertyValue(asset, NAME_PROPERTY_IDENTIFIER) ?? assetIdentifier.externalId,
    status: getPropertyValue(asset, STATUS_PROPERTY_IDENTIFIER),
    criticality: getPropertyValue(asset, CRITICALITY_PROPERTY_IDENTIFIER),
    tabCounts,
    error,
    isError,
    isFetching,
    isPending,
    retry,
  };
}
