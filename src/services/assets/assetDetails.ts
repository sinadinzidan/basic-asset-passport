import { MODEL } from '../../config/model';
import type { AssetIdentifier, AssetInstanceDetails } from '../../types/asset';
import type { AssetContextType } from '../../types/assetContext';

import { getMappedProperties, toInstanceDetails } from './instanceDetails';
import { findAssetPassportView, isNodeInstance, toViewReference } from './viewHelpers';

export async function getAssetDetails(
  client: AssetContextType,
  assetIdentifier: AssetIdentifier,
): Promise<AssetInstanceDetails> {
  const assetView = await findAssetPassportView(client, MODEL.views.asset);
  const assetViewReference = toViewReference(assetView);
  const assetProperties = getMappedProperties(assetView);
  const response = await client.instances.query({
    with: {
      asset: {
        nodes: {
          filter: {
            and: [
              {
                equals: {
                  property: ['node', 'space'],
                  value: assetIdentifier.space,
                },
              },
              {
                equals: {
                  property: ['node', 'externalId'],
                  value: assetIdentifier.externalId,
                },
              },
              { hasData: [assetViewReference] },
            ],
          },
        },
        limit: 1,
      },
    },
    select: {
      asset: {
        sources: [
          {
            source: assetViewReference,
            properties: assetProperties.map(({ identifier }) => identifier),
          },
        ],
      },
    },
  });

  const assetNode = (response.items.asset ?? []).find(isNodeInstance);

  if (!assetNode) {
    throw new Error(
      `Asset ${assetIdentifier.externalId} was not found in ${assetIdentifier.space}.`,
    );
  }

  return toInstanceDetails(assetNode, assetView, assetProperties);
}
