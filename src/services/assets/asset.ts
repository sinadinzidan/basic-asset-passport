import type { ViewDefinition } from '@cognite/sdk';

import {
  ASSET_LIST_PROPERTIES,
  ASSET_QUERY_LIMIT,
  ASSET_SEARCH_LIMIT,
  ASSET_SEARCH_PROPERTIES,
  ASSET_VIEW_EXTERNAL_ID,
} from '../../constants/assets';
import type { AssetListItem, AssetPage } from '../../types/asset';
import type { AssetContextType } from '../../types/assetContext';

import {
  findAssetPassportView,
  getNodeViewProperties,
  getStringProperty,
  isNodeInstance,
  toViewReference,
  type NodeInstance,
} from './viewHelpers';

export async function listAssets(client: AssetContextType, cursor?: string): Promise<AssetPage> {
  const assetView = await findAssetPassportView(client, ASSET_VIEW_EXTERNAL_ID);
  const viewReference = toViewReference(assetView);
  const response = await client.instances.query({
    ...(cursor ? { cursors: { assets: cursor } } : {}),
    with: {
      assets: {
        nodes: { filter: { hasData: [viewReference] } },
        limit: ASSET_QUERY_LIMIT,
      },
    },
    select: {
      assets: {
        sources: [{ source: viewReference, properties: [...ASSET_LIST_PROPERTIES] }],
      },
    },
  });

  const items = (response.items.assets ?? [])
    .filter(isNodeInstance)
    .map((node) => toAssetListItem(node, assetView));

  return { items, nextCursor: response.nextCursor.assets ?? null };
}

export async function searchAssets(
  client: AssetContextType,
  searchText: string,
): Promise<AssetPage> {
  const assetView = await findAssetPassportView(client, ASSET_VIEW_EXTERNAL_ID);
  const response = await client.instances.search({
    view: toViewReference(assetView),
    query: searchText,
    instanceType: 'node',
    properties: [...ASSET_SEARCH_PROPERTIES],
    limit: ASSET_SEARCH_LIMIT,
  });

  const items = response.items
    .filter(isNodeInstance)
    .map((node) => toAssetListItem(node, assetView));

  return { items, nextCursor: null };
}

function toAssetListItem(node: NodeInstance, assetView: ViewDefinition): AssetListItem {
  const properties = getNodeViewProperties(node, assetView);

  return {
    space: node.space,
    externalId: node.externalId,
    name: getStringProperty(properties, 'name'),
    description: getStringProperty(properties, 'description'),
    plantName: getStringProperty(properties, 'plantName'),
    flocStatus: getStringProperty(properties, 'flocStatus'),
    abcIndicatorName: getStringProperty(properties, 'abcIndicatorName'),
  };
}
