import type { CogniteClient } from '@cognite/sdk';

import { AVERAGE_AGGREGATE, FULFILLED_PROMISE_STATUS } from '../../../constants/cdfApi';
import { TREND_REQUEST_CHUNK_SIZE } from '../../../constants/timeseries';
import {
  AverageDatapointSchema,
  DatapointsItemSchema,
  DatapointsResponseSchema,
} from '../../../schemas/timeseries';
import type {
  TimeseriesContextType,
  TimeseriesIdentifier,
  TimeseriesPoint,
  TimeseriesTrend,
  TimeseriesTrendOptions,
  TimeseriesTrendWindow,
} from '../../../types/timeseries';

type DatapointsSdk = Pick<CogniteClient, 'project' | 'post'>;

class CdfTimeseriesContext implements TimeseriesContextType {
  readonly project: string;

  constructor(private readonly sdk: DatapointsSdk) {
    this.project = sdk.project;
  }

  getTrends = async (
    identifiers: TimeseriesIdentifier[],
    window: TimeseriesTrendWindow,
    options: TimeseriesTrendOptions = {},
  ): Promise<TimeseriesTrend[]> => {
    const chunks: TimeseriesIdentifier[][] = [];

    for (let start = 0; start < identifiers.length; start += TREND_REQUEST_CHUNK_SIZE) {
      chunks.push(identifiers.slice(start, start + TREND_REQUEST_CHUNK_SIZE));
    }

    if (options.isStrict) {
      const trends = await Promise.all(chunks.map((chunk) => this.requestChunk(chunk, window)));

      return trends.flat();
    }

    const results = await Promise.allSettled(
      chunks.map((chunk) => this.requestChunk(chunk, window)),
    );

    return results.flatMap((result, chunkIndex) =>
      result.status === FULFILLED_PROMISE_STATUS
        ? result.value
        : (chunks[chunkIndex] ?? []).map(toFailedTrend),
    );
  };

  private async requestChunk(
    identifiers: TimeseriesIdentifier[],
    window: TimeseriesTrendWindow,
  ): Promise<TimeseriesTrend[]> {
    const response = await this.sdk.post(
      `/api/v1/projects/${this.sdk.project}/timeseries/data/list`,
      {
        data: {
          items: identifiers.map(({ space, externalId }) => ({
            instanceId: { space, externalId },
          })),
          start: Math.round(window.from),
          end: Math.round(window.to),
          aggregates: [AVERAGE_AGGREGATE],
          granularity: window.granularity,
          ...(window.limit === undefined ? {} : { limit: window.limit }),
        },
      },
    );

    return readTrends(response.data);
  }
}

export function createTimeseriesContext(sdk: DatapointsSdk): TimeseriesContextType {
  return new CdfTimeseriesContext(sdk);
}

function toFailedTrend({ space, externalId }: TimeseriesIdentifier): TimeseriesTrend {
  return { space, externalId, points: [], hasFailed: true };
}

function readTrends(data: unknown): TimeseriesTrend[] {
  const response = DatapointsResponseSchema.safeParse(data);

  if (!response.success) return [];

  return response.data.items.flatMap((item): TimeseriesTrend[] => {
    const parsed = DatapointsItemSchema.safeParse(item);

    if (!parsed.success) return [];

    const points = parsed.data.datapoints
      .flatMap((datapoint): TimeseriesPoint[] => {
        const reading = AverageDatapointSchema.safeParse(datapoint);

        return reading.success
          ? [{ timestamp: reading.data.timestamp, value: reading.data.average }]
          : [];
      })
      .sort((first, second) => first.timestamp - second.timestamp);

    return [{ ...parsed.data.instanceId, points }];
  });
}
