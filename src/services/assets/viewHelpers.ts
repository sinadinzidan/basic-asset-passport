import type {
  DataModelProperty,
  NodeOrEdge,
  ViewDefinition,
  ViewReference,
} from '@cognite/sdk';

import {
  ASSET_PASSPORT_MODEL_EXTERNAL_ID,
  ASSET_PASSPORT_MODEL_SPACE,
  ASSET_PASSPORT_MODEL_VERSION,
} from '../../constants/assets';
import type { AssetDataClient } from '../../types/assetDataClient';

export type NodeInstance = Extract<NodeOrEdge, { instanceType: 'node' }>;

/** The views of the Asset_Passport data model: Asset, Equipment and Note. */
export async function listAssetPassportViews(
  client: AssetDataClient,
): Promise<ViewDefinition[]> {
  const { items } = await client.dataModels.retrieve(
    [
      {
        space: ASSET_PASSPORT_MODEL_SPACE,
        externalId: ASSET_PASSPORT_MODEL_EXTERNAL_ID,
        version: ASSET_PASSPORT_MODEL_VERSION,
      },
    ],
    { inlineViews: true },
  );
  const [model] = items;

  if (!model) {
    throw new Error(
      `The ${ASSET_PASSPORT_MODEL_EXTERNAL_ID} data model was not found in ${ASSET_PASSPORT_MODEL_SPACE}.`,
    );
  }

  return (model.views ?? []).filter(isViewDefinition);
}

function isViewDefinition(view: DataModelProperty): view is ViewDefinition {
  return 'properties' in view;
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
