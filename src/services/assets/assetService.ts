import {
  ASSET_LIST_PROPERTIES,
  ASSET_QUERY_LIMIT,
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
} from './viewHelpers';

export async function listAssets(
  client: AssetDataClient,
  cursor?: string,
): Promise<AssetPage> {
  const views = await listAssetPassportViews(client);
  const assetView = views.find(
    (view) => view.externalId === ASSET_VIEW_EXTERNAL_ID,
  );

  if (!assetView) {
    throw new Error(
      `The ${ASSET_VIEW_EXTERNAL_ID} view was not found in the ${ASSET_PASSPORT_MODEL_EXTERNAL_ID} data model.`,
    );
  }

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
    .map((node): AssetListItem => {
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
    });

  return { items, nextCursor: response.nextCursor.assets ?? null };
}

function getStringProperty(
  properties: Record<string, unknown> | undefined,
  propertyName: string,
): string | null {
  const value = properties?.[propertyName];
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}
