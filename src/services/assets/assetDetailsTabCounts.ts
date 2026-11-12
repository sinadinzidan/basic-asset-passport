import { EQUIPMENT_VIEW_EXTERNAL_ID } from '../../constants/assets';
import {
  DOCUMENT_VIEW_EXTERNAL_ID,
  FILES_ASSETS_PROPERTY,
  FILES_VIEW,
} from '../../constants/documents';
import { NOTE_VIEW_EXTERNAL_ID } from '../../constants/notes';
import {
  TIMESERIES_ASSETS_PROPERTY,
  TIMESERIES_VIEW_EXTERNAL_ID,
} from '../../constants/timeseries';
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
    return countNodesOfAsset(this.client, NOTE_VIEW_EXTERNAL_ID, assetIdentifier);
  };

  countAssetEquipment = (assetIdentifier: AssetIdentifier): Promise<number> => {
    return countNodesOfAsset(this.client, EQUIPMENT_VIEW_EXTERNAL_ID, assetIdentifier);
  };

  countAssetDocuments = (assetIdentifier: AssetIdentifier): Promise<number> => {
    return countNodesOfAsset(this.client, DOCUMENT_VIEW_EXTERNAL_ID, assetIdentifier);
  };

  countAssetTimeseries = async (assetIdentifier: AssetIdentifier): Promise<number> => {
    const timeseriesView = await findAssetPassportView(this.client, TIMESERIES_VIEW_EXTERNAL_ID);

    return countNodes(
      this.client,
      timeseriesView,
      matchAssetInList(timeseriesView, TIMESERIES_ASSETS_PROPERTY, assetIdentifier),
    );
  };

  countAssetLinkedFiles = (assetIdentifier: AssetIdentifier): Promise<number> => {
    return countNodes(
      this.client,
      FILES_VIEW,
      matchAssetInList(FILES_VIEW, FILES_ASSETS_PROPERTY, assetIdentifier),
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
