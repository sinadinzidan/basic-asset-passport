import { MODEL } from '../../config/model';
import { ASSET_EQUIPMENT_QUERY_LIMIT } from '../../constants/assets';
import { getRequestLimit, toLimitedList } from '../../lib/limitedList';
import type { AssetIdentifier, AssetInstanceDetails } from '../../types/asset';
import type { AssetContextType } from '../../types/assetContext';
import type { LimitedList } from '../../types/list';

import { matchAssetRelation } from './assetFilter';
import { getMappedProperties, toInstanceDetails } from './instanceDetails';
import { sortByName } from './querySort';
import { findAssetPassportView, isNodeInstance, toViewReference } from './viewHelpers';

export interface AssetEquipmentService {
  listAssetEquipment(
    assetIdentifier: AssetIdentifier,
    limit?: number,
  ): Promise<LimitedList<AssetInstanceDetails>>;
}

class CdfAssetEquipmentService implements AssetEquipmentService {
  constructor(private readonly client: AssetContextType) {}

  listAssetEquipment = async (
    assetIdentifier: AssetIdentifier,
    limit: number = ASSET_EQUIPMENT_QUERY_LIMIT,
  ): Promise<LimitedList<AssetInstanceDetails>> => {
    const equipmentView = await findAssetPassportView(this.client, MODEL.views.equipment);
    const viewReference = toViewReference(equipmentView);
    const mappedProperties = getMappedProperties(equipmentView);

    const response = await this.client.instances.query({
      with: {
        equipment: {
          nodes: {
            filter: {
              and: [
                { hasData: [viewReference] },
                matchAssetRelation(equipmentView, assetIdentifier),
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
  };
}

export function createAssetEquipmentService(client: AssetContextType): AssetEquipmentService {
  return new CdfAssetEquipmentService(client);
}
