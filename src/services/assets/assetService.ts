import type { ViewDefinition } from '@cognite/sdk';

import {
  ASSET_LIST_PROPERTIES,
  ASSET_QUERY_LIMIT,
  ASSET_SEARCH_LIMIT,
  ASSET_SEARCH_PROPERTIES,
  ASSET_VIEW_EXTERNAL_ID,
  ASSET_PASSPORT_MODEL_EXTERNAL_ID,
} from '../../constants/assets';
import type { AssetListItem, AssetPage } from '../../types/asset';
import type { AssetDataClient } from '../../types/assetDataClient';

import {
  getNodeViewProperties,
  isNodeInstance,
  listAssetPassportViews,
  toViewReference,
  type NodeInstance,
} from './viewHelpers';

export async function listAssets(
  client: AssetDataClient,
  cursor?: string,
): Promise<AssetPage> {
  const assetView = await findAssetView(client);
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
        sources: [
          { source: viewReference, properties: [...ASSET_LIST_PROPERTIES] },
        ],
      },
    },
  });

  const items = (response.items.assets ?? [])
    .filter(isNodeInstance)
    .map((node) => toAssetListItem(node, assetView));

  return { items, nextCursor: response.nextCursor.assets ?? null };
}

/**
 * The assets whose name, description or plant matches the text, found by
 * CDF's full-text search. A search has no cursor, so it is one page of at most
 * `ASSET_SEARCH_LIMIT` matches and never has a next page.
 */
export async function searchAssets(
  client: AssetDataClient,
  searchText: string,
): Promise<AssetPage> {
  const assetView = await findAssetView(client);
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

async function findAssetView(client: AssetDataClient): Promise<ViewDefinition> {
  const views = await listAssetPassportViews(client);
  const assetView = views.find(
    (view) => view.externalId === ASSET_VIEW_EXTERNAL_ID,
  );

  if (!assetView) {
    throw new Error(
      `The ${ASSET_VIEW_EXTERNAL_ID} view was not found in the ${ASSET_PASSPORT_MODEL_EXTERNAL_ID} data model.`,
    );
  }

  return assetView;
}

function toAssetListItem(
  node: NodeInstance,
  assetView: ViewDefinition,
): AssetListItem {
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

function getStringProperty(
  properties: Record<string, unknown> | undefined,
  propertyName: string,
): string | null {
  const value = properties?.[propertyName];
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}
