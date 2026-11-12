import type { PropertySortV3, ViewDefinition } from '@cognite/sdk';

import { MODEL } from '../../config/model';
import {
  DESCENDING_SORT_DIRECTION,
  INSTANCE_TYPE_NODE,
  NODE_CREATED_TIME_PROPERTY,
  NODE_EXTERNAL_ID_PROPERTY,
} from '../../constants/cdfApi';

import { toViewPropertyPath, type ViewIdentity } from './viewHelpers';

type SortOrder = Pick<PropertySortV3, 'direction' | 'nullsFirst'>;

const ASCENDING: SortOrder = { direction: 'ascending', nullsFirst: false };

export const SORT_BY_EXTERNAL_ID: PropertySortV3 = {
  property: [INSTANCE_TYPE_NODE, NODE_EXTERNAL_ID_PROPERTY],
  ...ASCENDING,
};

export const SORT_BY_NEWEST: PropertySortV3 = {
  property: [INSTANCE_TYPE_NODE, NODE_CREATED_TIME_PROPERTY],
  direction: DESCENDING_SORT_DIRECTION,
  nullsFirst: false,
};

export function sortByViewProperty(
  view: ViewIdentity,
  propertyIdentifier: string,
  order: SortOrder = ASCENDING,
): PropertySortV3 {
  return {
    property: toViewPropertyPath(view, propertyIdentifier),
    ...order,
  };
}

export function sortByName(view: ViewDefinition): PropertySortV3[] {
  return [
    ...(MODEL.properties.asset.name in view.properties
      ? [sortByViewProperty(view, MODEL.properties.asset.name)]
      : []),
    SORT_BY_EXTERNAL_ID,
  ];
}
