import type {
  QueryResponse,
  RawPropertyValueV3,
  ViewDefinition,
} from '@cognite/sdk';

import type { NodeInstance } from '../services/assets/viewHelpers';

export const TEST_VIEW_VERSION = 'test-version';
export const TEST_VIEW_SPACE = 'test-view-space';

type TestPropertyType = 'text' | 'direct' | 'json';

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
          type: { type: spec.type ?? 'text' },
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
