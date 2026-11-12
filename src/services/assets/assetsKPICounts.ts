import type { AggregationResponse } from '@cognite/sdk';

import { MODEL } from '../../config/model';
import { COUNT_PROPERTY, INSTANCE_TYPE_NODE } from '../../constants/cdfApi';
import { isOperatingStatus } from '../../lib/assetStatus';
import type { AssetContextType } from '../../types/assetContext';

import { countNodes, readCount } from './nodeCount';
import { findAssetPassportView, toViewReference } from './viewHelpers';

const MAX_STATUS_GROUPS = 1000;

export async function countAllAssets(client: AssetContextType): Promise<number> {
  return countNodes(client, await findAssetPassportView(client, MODEL.views.asset));
}

export async function countOperatingAssets(client: AssetContextType): Promise<number> {
  const assetView = toViewReference(await findAssetPassportView(client, MODEL.views.asset));

  const response = await client.instances.aggregate({
    view: assetView,
    instanceType: INSTANCE_TYPE_NODE,
    groupBy: [MODEL.properties.asset.status],
    aggregates: [{ count: { property: COUNT_PROPERTY } }],
    limit: MAX_STATUS_GROUPS,
  });

  return sumOperatingGroups(response);
}

export async function countAllEquipment(client: AssetContextType): Promise<number> {
  return countNodes(client, await findAssetPassportView(client, MODEL.views.equipment));
}

function sumOperatingGroups(response: AggregationResponse): number {
  return response.items.reduce((total, item) => {
    const status = item.group?.[MODEL.properties.asset.status];
    if (typeof status !== 'string' || !isOperatingStatus(status)) {
      return total;
    }
    return total + readCount({ items: [item] });
  }, 0);
}
