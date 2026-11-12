import {
  TIMESERIES_ASSETS_PROPERTY,
  TIMESERIES_QUERY_LIMIT,
  TIMESERIES_VIEW_EXTERNAL_ID,
} from '../../../constants/timeseries';
import { getRequestLimit, toLimitedList } from '../../../lib/limitedList';
import type { AssetIdentifier, AssetInstanceDetails } from '../../../types/asset';
import type { AssetContextType } from '../../../types/assetContext';
import type { LimitedList } from '../../../types/list';
import { matchAssetInList } from '../assetFilter';
import { getMappedProperties, toInstanceDetails } from '../instanceDetails';
import { sortByName } from '../querySort';
import { findAssetPassportView, isNodeInstance, toViewReference } from '../viewHelpers';

export async function listAssetTimeseries(
  client: AssetContextType,
  assetIdentifier: AssetIdentifier,
  limit: number = TIMESERIES_QUERY_LIMIT,
): Promise<LimitedList<AssetInstanceDetails>> {
  const timeseriesView = await findAssetPassportView(client, TIMESERIES_VIEW_EXTERNAL_ID);
  const viewReference = toViewReference(timeseriesView);
  const mappedProperties = getMappedProperties(timeseriesView);
  const response = await client.instances.query({
    with: {
      timeseries: {
        nodes: {
          filter: {
            and: [
              { hasData: [viewReference] },
              matchAssetInList(timeseriesView, TIMESERIES_ASSETS_PROPERTY, assetIdentifier),
            ],
          },
        },
        sort: sortByName(timeseriesView),
        limit: getRequestLimit(limit),
      },
    },
    select: {
      timeseries: {
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
    (response.items.timeseries ?? [])
      .filter(isNodeInstance)
      .map((node) => toInstanceDetails(node, timeseriesView, mappedProperties)),
    limit,
  );
}
