import type {
  CogniteClient,
  NodeOrEdge,
  ViewDefinition,
  ViewReference,
} from '@cognite/sdk';

import {
  ASSET_VIEW_LOOKUP_LIMIT,
  ASSET_VIEW_SPACE,
} from '../../constants/assets';

export type NodeInstance = Extract<NodeOrEdge, { instanceType: 'node' }>;

export async function listAssetSpaceViews(
  client: CogniteClient,
): Promise<ViewDefinition[]> {
  return client.views
    .list({
      space: ASSET_VIEW_SPACE,
      allVersions: false,
      includeInheritedProperties: true,
      limit: ASSET_VIEW_LOOKUP_LIMIT,
    })
    .autoPagingToArray({ limit: ASSET_VIEW_LOOKUP_LIMIT });
}

export function toViewReference(view: ViewDefinition): ViewReference {
  return {
    type: 'view',
    space: view.space,
    externalId: view.externalId,
    version: view.version,
  };
}

export function isNodeInstance(item: NodeOrEdge): item is NodeInstance {
  return item.instanceType === 'node';
}

export function getNodeViewProperties(
  node: NodeInstance,
  view: ViewDefinition,
): Record<string, unknown> | undefined {
  return node.properties?.[view.space]?.[`${view.externalId}/${view.version}`];
}
