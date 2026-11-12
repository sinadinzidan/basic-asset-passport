import { MODEL } from '../../config/model';
import type { AssetIdentifier } from '../../types/asset';
import type { AssetContextType } from '../../types/assetContext';

import { matchAssetInList, matchAssetRelation } from './assetFilter';
import { countNodes } from './nodeCount';
import { findAssetPassportView } from './viewHelpers';

export interface AssetDetailsTabCountService {
  countAssetNotes(assetIdentifier: AssetIdentifier): Promise<number>;
  countAssetEquipment(assetIdentifier: AssetIdentifier): Promise<number>;
  countAssetDocuments(assetIdentifier: AssetIdentifier): Promise<number>;
  countAssetTimeseries(assetIdentifier: AssetIdentifier): Promise<number>;
  countAssetLinkedFiles(assetIdentifier: AssetIdentifier): Promise<number>;
}

class CdfAssetDetailsTabCountService implements AssetDetailsTabCountService {
  constructor(private readonly client: AssetContextType) {}

  countAssetNotes = (assetIdentifier: AssetIdentifier): Promise<number> => {
    return countNodesOfAsset(this.client, MODEL.views.note, assetIdentifier);
  };

  countAssetEquipment = (assetIdentifier: AssetIdentifier): Promise<number> => {
    return countNodesOfAsset(this.client, MODEL.views.equipment, assetIdentifier);
  };

  countAssetDocuments = (assetIdentifier: AssetIdentifier): Promise<number> => {
    return countNodesOfAsset(this.client, MODEL.views.document, assetIdentifier);
  };

  countAssetTimeseries = async (assetIdentifier: AssetIdentifier): Promise<number> => {
    const timeseriesView = await findAssetPassportView(this.client, MODEL.views.timeseries);

    return countNodes(
      this.client,
      timeseriesView,
      matchAssetInList(timeseriesView, MODEL.properties.timeseries.assets, assetIdentifier),
    );
  };

  countAssetLinkedFiles = (assetIdentifier: AssetIdentifier): Promise<number> => {
    return countNodes(
      this.client,
      MODEL.filesView,
      matchAssetInList(MODEL.filesView, MODEL.properties.files.assets, assetIdentifier),
    );
  };
}

export function createAssetDetailsTabCountService(
  client: AssetContextType,
): AssetDetailsTabCountService {
  return new CdfAssetDetailsTabCountService(client);
}

async function countNodesOfAsset(
  client: AssetContextType,
  viewExternalId: string,
  assetIdentifier: AssetIdentifier,
): Promise<number> {
  const view = await findAssetPassportView(client, viewExternalId);

  return countNodes(client, view, matchAssetRelation(view, assetIdentifier));
}
