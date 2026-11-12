import { ASSET_EQUIPMENT_QUERY_LIMIT, EQUIPMENT_VIEW_EXTERNAL_ID } from '../../constants/assets';
import { getRequestLimit, toLimitedList } from '../../lib/limitedList';
import type { AssetIdentifier, AssetInstanceDetails } from '../../types/asset';
import type { AssetContextType } from '../../types/assetContext';
import type { LimitedList } from '../../types/list';

import { getMappedProperties, toInstanceDetails } from './instanceDetails';
import { sortByName } from './querySort';
import { findAssetPassportView, isNodeInstance, toViewReference } from './viewHelpers';

export async function listAssetEquipment(
  client: AssetContextType,
  assetIdentifier: AssetIdentifier,
  limit: number = ASSET_EQUIPMENT_QUERY_LIMIT,
): Promise<LimitedList<AssetInstanceDetails>> {
  const equipmentView = await findAssetPassportView(client, EQUIPMENT_VIEW_EXTERNAL_ID);
  const viewReference = toViewReference(equipmentView);
  const mappedProperties = getMappedProperties(equipmentView);
  const response = await client.instances.query({
    with: {
      equipment: {
        nodes: {
          filter: {
            and: [
              { hasData: [viewReference] },
              {
                equals: {
                  property: [
                    equipmentView.space,
                    `${equipmentView.externalId}/${equipmentView.version}`,
                    'asset',
                  ],
                  value: {
                    space: assetIdentifier.space,
                    externalId: assetIdentifier.externalId,
                  },
                },
              },
            ],
          },
        },
        sort: sortByName(equipmentView),
        limit: getRequestLimit(limit),
      },
    },
    select: {
      equipment: {
        sources: [
          {
            source: viewReference,
            properties: mappedProperties.map(({ identifier }) => identifier),
          },
        ],
      },
    },
  });

  return toLimitedList(
    (response.items.equipment ?? [])
      .filter(isNodeInstance)
      .map((node) => toInstanceDetails(node, equipmentView, mappedProperties)),
    limit,
  );
}
