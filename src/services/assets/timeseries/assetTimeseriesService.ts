import {
  ASSET_PASSPORT_MODEL_EXTERNAL_ID,
 NAME_PROPERTY_IDENTIFIER } from '../../../constants/assets';
import {
  TIMESERIES_ASSETS_PROPERTY,
  TIMESERIES_QUERY_LIMIT,
  TIMESERIES_VIEW_EXTERNAL_ID,
} from '../../../constants/timeseries';
import { getPropertyValue } from '../../../lib/assetProperties';
import type { AssetIdentifier, AssetInstanceDetails } from '../../../types/asset';
import type { AssetDataClient } from '../../../types/assetDataClient';
import { getMappedProperties, toInstanceDetails } from '../instanceDetails';
import {
  isNodeInstance,
  listAssetPassportViews,
  toViewReference,
} from '../viewHelpers';

/**
 * The time series linked to the asset through the `assets` relation of the
 * PI_Timeseries view, sorted by name. Only the series themselves are read, not
 * their datapoints.
 */
export async function listAssetTimeseries(
  client: AssetDataClient,
  assetIdentifier: AssetIdentifier,
): Promise<AssetInstanceDetails[]> {
  const views = await listAssetPassportViews(client);
  const timeseriesView = views.find(
    (view) => view.externalId === TIMESERIES_VIEW_EXTERNAL_ID,
  );

  if (!timeseriesView) {
    throw new Error(
      `The ${TIMESERIES_VIEW_EXTERNAL_ID} view was not found in the ${ASSET_PASSPORT_MODEL_EXTERNAL_ID} data model.`,
    );
  }

  const viewReference = toViewReference(timeseriesView);
  const mappedProperties = getMappedProperties(timeseriesView);
  const response = await client.instances.query({
    with: {
      timeseries: {
        nodes: {
          filter: {
            and: [
              { hasData: [viewReference] },
              {
                containsAny: {
                  property: [
                    timeseriesView.space,
                    `${timeseriesView.externalId}/${timeseriesView.version}`,
                    TIMESERIES_ASSETS_PROPERTY,
                  ],
                  values: [
                    {
                      space: assetIdentifier.space,
                      externalId: assetIdentifier.externalId,
                    },
                  ],
                },
              },
            ],
          },
        },
        limit: TIMESERIES_QUERY_LIMIT,
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

  return (response.items.timeseries ?? [])
    .filter(isNodeInstance)
    .map((node) => toInstanceDetails(node, timeseriesView, mappedProperties))
    .sort((first, second) =>
      getTimeseriesName(first).localeCompare(getTimeseriesName(second)),
    );
}

export function getTimeseriesName(timeseries: AssetInstanceDetails): string {
  return (
    getPropertyValue(timeseries, NAME_PROPERTY_IDENTIFIER) ??
    timeseries.externalId
  );
}
