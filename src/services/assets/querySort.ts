import type { PropertySortV3, ViewDefinition } from '@cognite/sdk';

import { NAME_PROPERTY_IDENTIFIER } from '../../constants/assets';
import {
  DESCENDING_SORT_DIRECTION,
  INSTANCE_TYPE_NODE,
  NODE_CREATED_TIME_PROPERTY,
  NODE_EXTERNAL_ID_PROPERTY,
} from '../../constants/cdfApi';

import type { ViewIdentity } from './viewHelpers';

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
    property: [view.space, `${view.externalId}/${view.version}`, propertyIdentifier],
    ...order,
  };
}

export function sortByName(view: ViewDefinition): PropertySortV3[] {
  return [
    ...(NAME_PROPERTY_IDENTIFIER in view.properties
      ? [sortByViewProperty(view, NAME_PROPERTY_IDENTIFIER)]
      : []),
    SORT_BY_EXTERNAL_ID,
  ];
}
