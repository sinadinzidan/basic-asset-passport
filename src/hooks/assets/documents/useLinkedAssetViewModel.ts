import {
  CRITICALITY_PROPERTY_IDENTIFIER,
  DESCRIPTION_PROPERTY_IDENTIFIER,
  NAME_PROPERTY_IDENTIFIER,
  PLANT_PROPERTY_IDENTIFIER,
  STATUS_PROPERTY_IDENTIFIER,
} from '../../../constants/assets';
import { NODE_EXTERNAL_ID_PROPERTY } from '../../../constants/cdfApi';
import { FUNCTIONAL_LOCATION_LABEL } from '../../../constants/labels';
import { getPropertyValue } from '../../../lib/assetProperties';
import type { AssetIdentifier, AssetPropertyDisplay } from '../../../types/asset';
import { useAssetDetails } from '../useAssetDetails';

const SHOWN_PROPERTY_IDENTIFIERS = [PLANT_PROPERTY_IDENTIFIER, DESCRIPTION_PROPERTY_IDENTIFIER];

export function useLinkedAssetViewModel(asset: AssetIdentifier) {
  const { data, error, isError, isFetching, isPending, refetch } = useAssetDetails(asset);

  const details: AssetPropertyDisplay[] = [
    {
      identifier: NODE_EXTERNAL_ID_PROPERTY,
      label: FUNCTIONAL_LOCATION_LABEL,
      value: asset.externalId,
    },
    ...SHOWN_PROPERTY_IDENTIFIERS.flatMap(
      (identifier) =>
        data?.properties.filter((property) => property.identifier === identifier) ?? [],
    ),
  ];

  function retry(): void {
    void refetch();
  }

  return {
    title: getPropertyValue(data, NAME_PROPERTY_IDENTIFIER) ?? asset.externalId,
    status: getPropertyValue(data, STATUS_PROPERTY_IDENTIFIER),
    criticality: getPropertyValue(data, CRITICALITY_PROPERTY_IDENTIFIER),
    details,
    error,
    isError,
    isFetching,
    isPending,
    retry,
  };
}
