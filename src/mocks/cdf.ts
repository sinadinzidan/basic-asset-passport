import type { QueryResponse, RawPropertyValueV3, ViewDefinition } from '@cognite/sdk';

import { DIRECT_PROPERTY_TYPE, JSON_PROPERTY_TYPE, TEXT_PROPERTY_TYPE } from '../constants/cdfApi';
import { TestPropertyType } from '../enums/testPropertyType';
import type { NodeInstance } from '../services/assets/viewHelpers';

const TEST_VIEW_VERSION = 'test-version';
export const TEST_VIEW_SPACE = 'test-view-space';

const API_TYPE_BY_TEST_PROPERTY_TYPE = {
  [TestPropertyType.TEXT]: TEXT_PROPERTY_TYPE,
  [TestPropertyType.DIRECT]: DIRECT_PROPERTY_TYPE,
  [TestPropertyType.JSON]: JSON_PROPERTY_TYPE,
} as const;

type TestPropertySpec = {
  label?: string;
  type?: TestPropertyType;
};

export function makeViewDefinition(
  externalId: string,
  properties: Record<string, TestPropertySpec> = {},
  version: string = TEST_VIEW_VERSION,
  space: string = TEST_VIEW_SPACE,
): ViewDefinition {
  return {
    externalId,
    space,
    version,
    properties: Object.fromEntries(
      Object.entries(properties).map(([identifier, spec]) => [
        identifier,
        {
          name: spec.label,
          container: {
            type: 'container',
            space,
            externalId,
          },
          containerPropertyIdentifier: identifier,
          type: {
            type: API_TYPE_BY_TEST_PROPERTY_TYPE[spec.type ?? TestPropertyType.TEXT],
          },
        },
      ]),
    ),
    createdTime: 0,
    lastUpdatedTime: 0,
    writable: false,
    queryable: true,
    usedFor: 'node',
    isGlobal: false,
    mappedContainers: [],
  };
}

export function makeNodeInstance(
  view: ViewDefinition,
  identifier: { space: string; externalId: string },
  properties: Record<string, RawPropertyValueV3>,
): NodeInstance {
  return {
    instanceType: 'node',
    space: identifier.space,
    externalId: identifier.externalId,
    createdTime: 0,
    lastUpdatedTime: 0,
    version: 1,
    properties: {
      [view.space]: { [`${view.externalId}/${view.version}`]: properties },
    },
  };
}

export function makeQueryResponse(
  items: QueryResponse['items'],
  nextCursor: QueryResponse['nextCursor'] = {},
): QueryResponse {
  return { items, nextCursor };
}
