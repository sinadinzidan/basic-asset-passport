import { MODEL } from '../../../config/model';
import { TIMESERIES_QUERY_LIMIT } from '../../../constants/timeseries';
import { getRequestLimit, toLimitedList } from '../../../lib/limitedList';
import type { AssetIdentifier, AssetInstanceDetails } from '../../../types/asset';
import type { AssetContextType } from '../../../types/assetContext';
import type { LimitedList } from '../../../types/list';
import { matchAssetInList } from '../assetFilter';
import { getMappedProperties, toInstanceDetails } from '../instanceDetails';
import { sortByName } from '../querySort';
import { findAssetPassportView, isNodeInstance, toViewReference } from '../viewHelpers';

export interface AssetTimeseriesService {
  listAssetTimeseries(
    assetIdentifier: AssetIdentifier,
    limit?: number,
  ): Promise<LimitedList<AssetInstanceDetails>>;
}

class CdfAssetTimeseriesService implements AssetTimeseriesService {
  constructor(private readonly client: AssetContextType) {}

  listAssetTimeseries = async (
    assetIdentifier: AssetIdentifier,
    limit: number = TIMESERIES_QUERY_LIMIT,
  ): Promise<LimitedList<AssetInstanceDetails>> => {
    const timeseriesView = await findAssetPassportView(this.client, MODEL.views.timeseries);
    const viewReference = toViewReference(timeseriesView);
    const mappedProperties = getMappedProperties(timeseriesView);

    const response = await this.client.instances.query({
      with: {
        timeseries: {
          nodes: {
            filter: {
              and: [
                { hasData: [viewReference] },
                matchAssetInList(
                  timeseriesView,
                  MODEL.properties.timeseries.assets,
                  assetIdentifier,
                ),
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
  };
}

export function createAssetTimeseriesService(client: AssetContextType): AssetTimeseriesService {
  return new CdfAssetTimeseriesService(client);
}
