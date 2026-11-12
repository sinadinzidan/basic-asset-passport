import { MODEL } from '../../config/model';
import type { AssetIdentifier } from '../../types/asset';
import type { AssetContextType } from '../../types/assetContext';

import { matchAssetInList, matchAssetRelation } from './assetFilter';
import { countNodes } from './nodeCount';
import { findAssetPassportView } from './viewHelpers';

export function countAssetNotes(
  client: AssetContextType,
  assetIdentifier: AssetIdentifier,
): Promise<number> {
  return countNodesOfAsset(client, MODEL.views.note, assetIdentifier);
}

export function countAssetEquipment(
  client: AssetContextType,
  assetIdentifier: AssetIdentifier,
): Promise<number> {
  return countNodesOfAsset(client, MODEL.views.equipment, assetIdentifier);
}

export function countAssetDocuments(
  client: AssetContextType,
  assetIdentifier: AssetIdentifier,
): Promise<number> {
  return countNodesOfAsset(client, MODEL.views.document, assetIdentifier);
}

export async function countAssetTimeseries(
  client: AssetContextType,
  assetIdentifier: AssetIdentifier,
): Promise<number> {
  const timeseriesView = await findAssetPassportView(client, MODEL.views.timeseries);

  return countNodes(
    client,
    timeseriesView,
    matchAssetInList(timeseriesView, MODEL.properties.timeseries.assets, assetIdentifier),
  );
}

export function countAssetLinkedFiles(
  client: AssetContextType,
  assetIdentifier: AssetIdentifier,
): Promise<number> {
  return countNodes(
    client,
    MODEL.filesView,
    matchAssetInList(MODEL.filesView, MODEL.properties.files.assets, assetIdentifier),
  );
}

async function countNodesOfAsset(
  client: AssetContextType,
  viewExternalId: string,
  assetIdentifier: AssetIdentifier,
): Promise<number> {
  const view = await findAssetPassportView(client, viewExternalId);

  return countNodes(client, view, matchAssetRelation(view, assetIdentifier));
}
