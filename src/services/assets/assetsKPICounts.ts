import type { AggregationResponse } from '@cognite/sdk';

import { MODEL } from '../../config/model';
import { COUNT_PROPERTY, INSTANCE_TYPE_NODE } from '../../constants/cdfApi';
import { isOperatingStatus } from '../../lib/assetStatus';
import type { AssetContextType } from '../../types/assetContext';

import { countNodes, readCount } from './nodeCount';
import { findAssetPassportView, toViewReference } from './viewHelpers';

const MAX_STATUS_GROUPS = 1000;

export interface AssetsKPICountService {
  countAllAssets(): Promise<number>;
  countOperatingAssets(): Promise<number>;
  countAllEquipment(): Promise<number>;
}

class CdfAssetsKPICountService implements AssetsKPICountService {
  constructor(private readonly client: AssetContextType) {}

  countAllAssets = async (): Promise<number> => {
    return countNodes(this.client, await findAssetPassportView(this.client, MODEL.views.asset));
  };

  countOperatingAssets = async (): Promise<number> => {
    const assetView = toViewReference(await findAssetPassportView(this.client, MODEL.views.asset));

    const response = await this.client.instances.aggregate({
      view: assetView,
      instanceType: INSTANCE_TYPE_NODE,
      groupBy: [MODEL.properties.asset.status],
      aggregates: [{ count: { property: COUNT_PROPERTY } }],
      limit: MAX_STATUS_GROUPS,
    });

    return sumOperatingGroups(response);
  };

  countAllEquipment = async (): Promise<number> => {
    return countNodes(this.client, await findAssetPassportView(this.client, MODEL.views.equipment));
  };
}

export function createAssetsKPICountService(client: AssetContextType): AssetsKPICountService {
  return new CdfAssetsKPICountService(client);
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
