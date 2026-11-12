import type { AggregationResponse, FilterDefinition } from '@cognite/sdk';

import { EQUIPMENT_VIEW_EXTERNAL_ID } from '../../constants/assets';
import { COUNT_AGGREGATE, COUNT_PROPERTY } from '../../constants/cdfApi';
import {
  DOCUMENT_VIEW_EXTERNAL_ID,
  FILES_ASSETS_PROPERTY,
  FILES_VIEW_EXTERNAL_ID,
  FILES_VIEW_SPACE,
  FILES_VIEW_VERSION,
} from '../../constants/documents';
import { NOTE_VIEW_EXTERNAL_ID } from '../../constants/notes';
import {
  TIMESERIES_ASSETS_PROPERTY,
  TIMESERIES_VIEW_EXTERNAL_ID,
} from '../../constants/timeseries';
import type { AssetIdentifier } from '../../types/asset';
import type { AssetContextType } from '../../types/assetContext';

import { findAssetPassportView, toViewReference, type ViewIdentity } from './viewHelpers';

const filesView: ViewIdentity = {
  space: FILES_VIEW_SPACE,
  externalId: FILES_VIEW_EXTERNAL_ID,
  version: FILES_VIEW_VERSION,
};

export async function countAssetNotes(
  client: AssetContextType,
  assetIdentifier: AssetIdentifier,
): Promise<number> {
  const noteView = await findAssetPassportView(client, NOTE_VIEW_EXTERNAL_ID);

  return countNodes(
    client,
    noteView,
    (property) => ({
      equals: { property, value: toAssetReference(assetIdentifier) },
    }),
    'asset',
  );
}

export async function countAssetEquipment(
  client: AssetContextType,
  assetIdentifier: AssetIdentifier,
): Promise<number> {
  const equipmentView = await findAssetPassportView(client, EQUIPMENT_VIEW_EXTERNAL_ID);

  return countNodes(
    client,
    equipmentView,
    (property) => ({
      equals: { property, value: toAssetReference(assetIdentifier) },
    }),
    'asset',
  );
}

export async function countAssetDocuments(
  client: AssetContextType,
  assetIdentifier: AssetIdentifier,
): Promise<number> {
  const documentView = await findAssetPassportView(client, DOCUMENT_VIEW_EXTERNAL_ID);

  return countNodes(
    client,
    documentView,
    (property) => ({
      equals: { property, value: toAssetReference(assetIdentifier) },
    }),
    'asset',
  );
}

export async function countAssetTimeseries(
  client: AssetContextType,
  assetIdentifier: AssetIdentifier,
): Promise<number> {
  const timeseriesView = await findAssetPassportView(client, TIMESERIES_VIEW_EXTERNAL_ID);

  return countNodes(
    client,
    timeseriesView,
    (property) => ({
      containsAny: { property, values: [toAssetReference(assetIdentifier)] },
    }),
    TIMESERIES_ASSETS_PROPERTY,
  );
}

export function countAssetLinkedFiles(
  client: AssetContextType,
  assetIdentifier: AssetIdentifier,
): Promise<number> {
  return countNodes(
    client,
    filesView,
    (property) => ({
      containsAny: { property, values: [toAssetReference(assetIdentifier)] },
    }),
    FILES_ASSETS_PROPERTY,
  );
}

async function countNodes(
  client: AssetContextType,
  view: ViewIdentity,
  makeRelationFilter: (property: [string, string, string]) => FilterDefinition,
  relationProperty: string,
): Promise<number> {
  const viewReference = toViewReference(view);
  const response = await client.instances.aggregate({
    view: viewReference,
    instanceType: 'node',

    aggregates: [{ count: { property: COUNT_PROPERTY } }],
    filter: makeRelationFilter([
      view.space,
      `${view.externalId}/${view.version}`,
      relationProperty,
    ]),
  });

  return readCount(response);
}

export function readCount(response: AggregationResponse): number {
  const [result] = response.items;
  const countValue = result?.aggregates.find(
    (aggregate) => aggregate.aggregate === COUNT_AGGREGATE,
  );

  return countValue && 'value' in countValue && countValue.value !== undefined
    ? countValue.value
    : 0;
}

function toAssetReference({ space, externalId }: AssetIdentifier) {
  return { space, externalId };
}
