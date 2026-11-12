import type { ViewDefinition } from '@cognite/sdk';

import { MODEL } from '../../config/model';
import {
  ASSET_LIST_PROPERTIES,
  ASSET_QUERY_LIMIT,
  ASSET_SEARCH_LIMIT,
  ASSET_SEARCH_PROPERTIES,
} from '../../constants/assets';
import { INSTANCE_TYPE_NODE } from '../../constants/cdfApi';
import { getRequestLimit, toLimitedList } from '../../lib/limitedList';
import { AssetListPropertiesSchema } from '../../schemas/asset';
import type { AssetListItem, AssetPage } from '../../types/asset';
import type { AssetContextType } from '../../types/assetContext';

import {
  findAssetPassportView,
  getNodeViewProperties,
  isNodeInstance,
  toViewReference,
  type NodeInstance,
} from './viewHelpers';

export async function listAssets(client: AssetContextType, cursor?: string): Promise<AssetPage> {
  const assetView = await findAssetPassportView(client, MODEL.views.asset);
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

  const nextCursor = response.nextCursor.assets ?? null;

  return { items, nextCursor, hasMore: nextCursor !== null };
}

export async function searchAssets(
  client: AssetContextType,
  searchText: string,
): Promise<AssetPage> {
  const assetView = await findAssetPassportView(client, MODEL.views.asset);
  const response = await client.instances.search({
    view: toViewReference(assetView),
    query: searchText,
    instanceType: INSTANCE_TYPE_NODE,
    properties: [...ASSET_SEARCH_PROPERTIES],
    limit: getRequestLimit(ASSET_SEARCH_LIMIT),
  });

  const matches = response.items
    .filter(isNodeInstance)
    .map((node) => toAssetListItem(node, assetView));

  return { ...toLimitedList(matches, ASSET_SEARCH_LIMIT), nextCursor: null };
}

function toAssetListItem(node: NodeInstance, assetView: ViewDefinition): AssetListItem {
  return {
    space: node.space,
    externalId: node.externalId,
    ...AssetListPropertiesSchema.parse(getNodeViewProperties(node, assetView) ?? {}),
  };
}
