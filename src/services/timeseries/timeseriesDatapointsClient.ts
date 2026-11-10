import type { CogniteClient } from '@cognite/sdk';

import { TREND_REQUEST_CHUNK_SIZE } from '../../constants/timeseries';
import type {
  TimeseriesDatapointsClient,
  TimeseriesIdentifier,
  TimeseriesPoint,
  TimeseriesTrend,
  TimeseriesTrendOptions,
  TimeseriesTrendWindow,
} from '../../types/timeseries';

type DatapointsSdk = Pick<CogniteClient, 'project' | 'post'>;

/**
 * Adapts the SDK to the recent averages the previews need. Series are asked
 * for in requests of limited size; a request that fails leaves its series out
 * instead of failing the others, because a preview is secondary to the list.
 * A strict read rejects instead, for callers that must show the failure.
 */
export function createTimeseriesDatapointsClient(
  sdk: DatapointsSdk,
): TimeseriesDatapointsClient {
  async function requestChunk(
    identifiers: TimeseriesIdentifier[],
    window: TimeseriesTrendWindow,
  ): Promise<TimeseriesTrend[]> {
    const response = await sdk.post(
      `/api/v1/projects/${sdk.project}/timeseries/data/list`,
      {
        data: {
          items: identifiers.map(({ space, externalId }) => ({
            instanceId: { space, externalId },
          })),
          // Whole milliseconds: the API rejects a fractional timestamp, which a panned or zoomed chart range can produce.
          start: Math.round(window.from),
          end: Math.round(window.to),
          aggregates: ['average'],
          granularity: window.granularity,
          ...(window.limit === undefined ? {} : { limit: window.limit }),
        },
      },
    );

    return readTrends(response.data);
  }

  return {
    project: sdk.project,
    async getTrends(identifiers, window, options: TimeseriesTrendOptions = {}) {
      const chunks: TimeseriesIdentifier[][] = [];
      for (let start = 0; start < identifiers.length; start += TREND_REQUEST_CHUNK_SIZE) {
        chunks.push(identifiers.slice(start, start + TREND_REQUEST_CHUNK_SIZE));
      }

      if (options.isStrict) {
        const trends = await Promise.all(
          chunks.map((chunk) => requestChunk(chunk, window)),
        );
        return trends.flat();
      }

      const results = await Promise.allSettled(
        chunks.map((chunk) => requestChunk(chunk, window)),
      );

      return results.flatMap((result) =>
        result.status === 'fulfilled' ? result.value : [],
      );
    },
  };
}

function readTrends(data: unknown): TimeseriesTrend[] {
  if (!isRecord(data) || !Array.isArray(data.items)) return [];

  return data.items.flatMap((item: unknown): TimeseriesTrend[] => {
    if (!isRecord(item) || !isRecord(item.instanceId)) return [];

    const { space, externalId } = item.instanceId;
    if (typeof space !== 'string' || typeof externalId !== 'string') return [];

    const datapoints: unknown[] = Array.isArray(item.datapoints)
      ? item.datapoints
      : [];
    const points = datapoints
      .flatMap((datapoint): TimeseriesPoint[] =>
        isRecord(datapoint) &&
        typeof datapoint.timestamp === 'number' &&
        typeof datapoint.average === 'number'
          ? [{ timestamp: datapoint.timestamp, value: datapoint.average }]
          : [],
      )
      .sort((first, second) => first.timestamp - second.timestamp);

    return [{ space, externalId, points }];
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
