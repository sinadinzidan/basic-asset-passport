import type { FilterDefinition } from '@cognite/sdk';

import { ASSET_RELATION_PROPERTY_IDENTIFIER } from '../../constants/cdfApi';
import type { AssetIdentifier } from '../../types/asset';

import { toViewPropertyPath, type ViewIdentity } from './viewHelpers';

export function matchAssetRelation(
  view: ViewIdentity,
  assetIdentifier: AssetIdentifier,
): FilterDefinition {
  return {
    equals: {
      property: toViewPropertyPath(view, ASSET_RELATION_PROPERTY_IDENTIFIER),
      value: toAssetReference(assetIdentifier),
    },
  };
}

export function matchAssetInList(
  view: ViewIdentity,
  propertyIdentifier: string,
  assetIdentifier: AssetIdentifier,
): FilterDefinition {
  return {
    containsAny: {
      property: toViewPropertyPath(view, propertyIdentifier),
      values: [toAssetReference(assetIdentifier)],
    },
  };
}

function toAssetReference({ space, externalId }: AssetIdentifier): AssetIdentifier {
  return { space, externalId };
}
