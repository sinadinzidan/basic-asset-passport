import type { ChartDataAdapter, TimeSeriesData, TimeSeriesDefinition } from '@flows/trend-chart';

import { DESCRIPTION_PROPERTY_IDENTIFIER } from '../../../constants/assets';
import {
  CHART_MAX_POINTS,
  CHART_NUMERIC_DATA_TYPE,
  CHART_QUERY_LIMIT_FACTOR,
} from '../../../constants/timeseries';
import { getPropertyValue } from '../../../lib/assetProperties';
import { chooseChartGranularity } from '../../../lib/timeseriesGranularity';
import {
  getTimeseriesKey,
  getTimeseriesName,
  getTimeseriesUnit,
  isNonNumericTimeseries,
} from '../../../lib/timeseriesProperties';
import type { AssetInstanceDetails } from '../../../types/asset';
import type { TimeseriesContextType } from '../../../types/timeseries';

import { getTimeseriesThresholds } from './timeseriesThresholds';

type TimeseriesChartAdapterOptions = {
  sourceName: string;
  isSimulated: boolean;
};

export function getChartableTimeseries(
  series: readonly AssetInstanceDetails[],
): AssetInstanceDetails[] {
  return series.filter((timeseries) => !isNonNumericTimeseries(timeseries));
}

export function createTimeseriesChartAdapter(
  client: TimeseriesContextType,
  series: readonly AssetInstanceDetails[],
  { sourceName, isSimulated }: TimeseriesChartAdapterOptions,
): ChartDataAdapter {
  const chartable = getChartableTimeseries(series);
  const definitions = chartable.map((timeseries): TimeSeriesDefinition => ({
    id: getTimeseriesKey(timeseries),
    name: getTimeseriesName(timeseries),
    tag: timeseries.externalId,
    description: getPropertyValue(timeseries, DESCRIPTION_PROPERTY_IDENTIFIER) ?? '',
    unit: getTimeseriesUnit(timeseries) ?? undefined,
    dataType: CHART_NUMERIC_DATA_TYPE,
    sourceName,
    isSimulated,
  }));
  const identifierById = new Map(
    chartable.map((timeseries) => [
      getTimeseriesKey(timeseries),
      { space: timeseries.space, externalId: timeseries.externalId },
    ]),
  );
  const definitionById = new Map(definitions.map((definition) => [definition.id, definition]));

  return {
    searchSeries: (query, { limit }) => {
      const needle = query.trim().toLowerCase();
      const matches = definitions.filter(
        (definition) =>
          needle.length === 0 ||
          [definition.name, definition.tag, definition.description].some((text) =>
            text.toLowerCase().includes(needle),
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

    getSeriesDetails: (seriesId) => Promise.resolve(definitionById.get(seriesId)),
    getThresholds: (seriesIds) =>
      Promise.resolve(
        chartable
          .filter((timeseries) => seriesIds.includes(getTimeseriesKey(timeseries)))
          .flatMap(getTimeseriesThresholds),
      ),
    getAlerts: () => Promise.resolve([]),
    getConnectedFiles: () => Promise.resolve([]),
    getEvents: () => Promise.resolve([]),
  };
}
