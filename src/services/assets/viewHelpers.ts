import type { DataModelProperty, NodeOrEdge, ViewDefinition, ViewReference } from '@cognite/sdk';

import { MODEL } from '../../config/model';
import { INSTANCE_TYPE_NODE, VIEW_SOURCE_TYPE } from '../../constants/cdfApi';
import type { AssetContextType } from '../../types/assetContext';

export type NodeInstance = Extract<NodeOrEdge, { instanceType: 'node' }>;

const viewsByClient = new WeakMap<AssetContextType, Promise<ViewDefinition[]>>();

export function listAssetPassportViews(client: AssetContextType): Promise<ViewDefinition[]> {
  const knownViews = viewsByClient.get(client);

  if (knownViews) {
    return knownViews;
  }

  const views = retrieveAssetPassportViews(client);
  viewsByClient.set(client, views);
  views.catch(() => viewsByClient.delete(client));

  return views;
}

async function retrieveAssetPassportViews(client: AssetContextType): Promise<ViewDefinition[]> {
  const { items } = await client.dataModels.retrieve(
    [
      {
        space: MODEL.space,
        externalId: MODEL.externalId,
        version: MODEL.version,
      },
    ],
    { inlineViews: true },
  );
  const [model] = items;

  if (!model) {
    throw new Error(`The ${MODEL.externalId} data model was not found in ${MODEL.space}.`);
  }

  return (model.views ?? []).filter(isViewDefinition);
}

export async function findAssetPassportView(
  client: AssetContextType,
  viewExternalId: string,
): Promise<ViewDefinition> {
  const views = await listAssetPassportViews(client);
  const foundView = views.find((view) => view.externalId === viewExternalId);

  if (!foundView) {
    throw new Error(
      `The ${viewExternalId} view was not found in the ${MODEL.externalId} data model.`,
    );
  }

  return foundView;
}

function isViewDefinition(view: DataModelProperty): view is ViewDefinition {
  return 'properties' in view;
}

export type ViewIdentity = Pick<ViewDefinition, 'space' | 'externalId' | 'version'>;

export function toViewReference(view: ViewIdentity): ViewReference {
  return {
    type: VIEW_SOURCE_TYPE,
    space: view.space,
    externalId: view.externalId,
    version: view.version,
  };
}

export function toViewPropertyPath(
  view: ViewIdentity,
  propertyIdentifier: string,
): [string, string, string] {
  return [view.space, `${view.externalId}/${view.version}`, propertyIdentifier];
}

export function isNodeInstance(item: NodeOrEdge): item is NodeInstance {
  return item.instanceType === INSTANCE_TYPE_NODE;
}

export function getNodeViewProperties(
  node: NodeInstance,
  view: ViewIdentity,
): Record<string, unknown> | undefined {
  return node.properties?.[view.space]?.[`${view.externalId}/${view.version}`];
}
