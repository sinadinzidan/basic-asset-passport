import { MODEL } from '../../../config/model';
import { NODE_EXTERNAL_ID_PROPERTY } from '../../../constants/cdfApi';
import { FUNCTIONAL_LOCATION_LABEL } from '../../../constants/labels';
import { getPropertyValue } from '../../../lib/assetProperties';
import type { AssetIdentifier, AssetPropertyDisplay } from '../../../types/asset';
import { useAssetDetails } from '../useAssetDetails';

const SHOWN_PROPERTY_IDENTIFIERS = [
  MODEL.properties.asset.plantName,
  MODEL.properties.asset.description,
];

export function useLinkedAssetViewModel(asset: AssetIdentifier) {
  const { data, error, isError, isFetching, isPending, retry } = useAssetDetails(asset);

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

  return {
    title: getPropertyValue(data, MODEL.properties.asset.name) ?? asset.externalId,
    status: getPropertyValue(data, MODEL.properties.asset.status),
    criticality: getPropertyValue(data, MODEL.properties.asset.criticality),
    details,
    error,
    isError,
    isFetching,
    isPending,
    retry,
  };
}
