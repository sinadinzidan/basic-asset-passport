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

export function countAssetNotes(
  client: AssetContextType,
  assetIdentifier: AssetIdentifier,
): Promise<number> {
  return countNodesOfAsset(client, NOTE_VIEW_EXTERNAL_ID, assetIdentifier);
}

export function countAssetEquipment(
  client: AssetContextType,
  assetIdentifier: AssetIdentifier,
): Promise<number> {
  return countNodesOfAsset(client, EQUIPMENT_VIEW_EXTERNAL_ID, assetIdentifier);
}

export function countAssetDocuments(
  client: AssetContextType,
  assetIdentifier: AssetIdentifier,
): Promise<number> {
  return countNodesOfAsset(client, DOCUMENT_VIEW_EXTERNAL_ID, assetIdentifier);
}

export async function countAssetTimeseries(
  client: AssetContextType,
  assetIdentifier: AssetIdentifier,
): Promise<number> {
  const timeseriesView = await findAssetPassportView(client, TIMESERIES_VIEW_EXTERNAL_ID);

  return countNodes(
    client,
    timeseriesView,
    matchAssetInList(timeseriesView, TIMESERIES_ASSETS_PROPERTY, assetIdentifier),
  );
}

export function countAssetLinkedFiles(
  client: AssetContextType,
  assetIdentifier: AssetIdentifier,
): Promise<number> {
  return countNodes(
    client,
    FILES_VIEW,
    matchAssetInList(FILES_VIEW, FILES_ASSETS_PROPERTY, assetIdentifier),
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
