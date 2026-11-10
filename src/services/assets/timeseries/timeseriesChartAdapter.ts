import type {
  ChartDataAdapter,
  TimeSeriesData,
  TimeSeriesDefinition,
} from '@flows/trend-chart';

import {
  CHART_QUERY_LIMIT_FACTOR,
  CHART_MAX_POINTS,
} from '../../../constants/timeseries';
import { getPropertyValue } from '../../../lib/assetProperties';
import { chooseChartGranularity } from '../../../lib/timeseriesGranularity';
import {
  getTimeseriesKey,
  getTimeseriesUnit,
  isNonNumericTimeseries,
} from '../../../lib/timeseriesProperties';
import type { AssetInstanceDetails } from '../../../types/asset';
import type { TimeseriesDatapointsClient } from '../../../types/timeseries';

import { getTimeseriesName } from './assetTimeseriesService';
import { getTimeseriesThresholds } from './timeseriesThresholds';

type TimeseriesChartAdapterOptions = {
  /** What the chart tells the user the readings come from. */
  sourceName: string;
  /** True when the readings are generated, which the chart must say. */
  isSimulated: boolean;
};

/** The series the chart can draw: the numeric ones, since string and state series have no trend. */
export function getChartableTimeseries(
  series: readonly AssetInstanceDetails[],
): AssetInstanceDetails[] {
  return series.filter((timeseries) => !isNonNumericTimeseries(timeseries));
}

/**
 * Serves the trend chart the numeric series linked to one asset. Readings are
 * averages at a step chosen from the window, so any window stays within the
 * chart's point budget. The limits a series carries become its threshold
 * lines. Alerts, files and events are not part of the Asset Passport model, so
 * the chart gets none.
 */
export function createTimeseriesChartAdapter(
  client: TimeseriesDatapointsClient,
  series: readonly AssetInstanceDetails[],
  { sourceName, isSimulated }: TimeseriesChartAdapterOptions,
): ChartDataAdapter {
  const chartable = getChartableTimeseries(series);
  const definitions = chartable.map(
    (timeseries): TimeSeriesDefinition => ({
      id: getTimeseriesKey(timeseries),
      name: getTimeseriesName(timeseries),
      tag: timeseries.externalId,
      description: getPropertyValue(timeseries, 'description') ?? '',
      unit: getTimeseriesUnit(timeseries) ?? undefined,
      dataType: 'Numeric',
      sourceName,
      isSimulated,
    }),
  );
  const identifierById = new Map(
    chartable.map((timeseries) => [
      getTimeseriesKey(timeseries),
      { space: timeseries.space, externalId: timeseries.externalId },
    ]),
  );
  const definitionById = new Map(
    definitions.map((definition) => [definition.id, definition]),
  );

  return {
    searchSeries: (query, { limit }) => {
      const needle = query.trim().toLowerCase();
      const matches = definitions.filter(
        (definition) =>
          needle.length === 0 ||
          [definition.name, definition.tag, definition.description].some(
            (text) => text.toLowerCase().includes(needle),
          ),
      );

      return Promise.resolve({
        series: matches.slice(0, limit),
        total: matches.length,
      });
    },

    getSeriesData: async (seriesIds, range): Promise<TimeSeriesData[]> => {
      const identifiers = seriesIds.flatMap((seriesId) => {
        const identifier = identifierById.get(seriesId);
        return identifier ? [identifier] : [];
      });
      if (identifiers.length === 0) return [];

      // Strict: a failed read must reach the chart as an error with a retry, not look like a series without data.
      const trends = await client.getTrends(
        identifiers,
        {
          from: range.start,
          to: range.end,
          granularity: chooseChartGranularity(range.end - range.start),
          limit: CHART_MAX_POINTS * CHART_QUERY_LIMIT_FACTOR,
        },
        { isStrict: true },
      );

      return trends.map((trend) => ({
        seriesId: getTimeseriesKey(trend),
        points: trend.points,
      }));
    },

    getSeriesDetails: (seriesId) =>
      Promise.resolve(definitionById.get(seriesId)),
    getThresholds: (seriesIds) =>
      Promise.resolve(
        chartable
          .filter((timeseries) =>
            seriesIds.includes(getTimeseriesKey(timeseries)),
          )
          .flatMap(getTimeseriesThresholds),
      ),
    getAlerts: () => Promise.resolve([]),
    getConnectedFiles: () => Promise.resolve([]),
    getEvents: () => Promise.resolve([]),
  };
}
