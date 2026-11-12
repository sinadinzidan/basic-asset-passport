import type { ChartDataAdapter, TimeSeriesData, TimeSeriesDefinition } from '@flows/trend-chart';

import { MODEL } from '../../../config/model';
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
import type { TimeseriesContextType, TimeseriesIdentifier } from '../../../types/timeseries';

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

class CdfTimeseriesChartAdapter implements ChartDataAdapter {
  private readonly chartable: AssetInstanceDetails[];

  private readonly definitions: TimeSeriesDefinition[];

  private readonly identifierById: Map<string, TimeseriesIdentifier>;

  private readonly definitionById: Map<string, TimeSeriesDefinition>;

  constructor(
    private readonly client: TimeseriesContextType,
    series: readonly AssetInstanceDetails[],
    { sourceName, isSimulated }: TimeseriesChartAdapterOptions,
  ) {
    this.chartable = getChartableTimeseries(series);
    this.definitions = this.chartable.map((timeseries): TimeSeriesDefinition => ({
      id: getTimeseriesKey(timeseries),
      name: getTimeseriesName(timeseries),
      tag: timeseries.externalId,
      description: getPropertyValue(timeseries, MODEL.properties.asset.description) ?? '',
      unit: getTimeseriesUnit(timeseries) ?? undefined,
      dataType: CHART_NUMERIC_DATA_TYPE,
      sourceName,
      isSimulated,
    }));
    this.identifierById = new Map(
      this.chartable.map((timeseries) => [
        getTimeseriesKey(timeseries),
        { space: timeseries.space, externalId: timeseries.externalId },
      ]),
    );
    this.definitionById = new Map(
      this.definitions.map((definition) => [definition.id, definition]),
    );
  }

  searchSeries: ChartDataAdapter['searchSeries'] = (query, { limit }) => {
    const needle = query.trim().toLowerCase();
    const matches = this.definitions.filter(
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
  };

  getSeriesData: ChartDataAdapter['getSeriesData'] = async (
    seriesIds,
    range,
  ): Promise<TimeSeriesData[]> => {
    const identifiers = seriesIds.flatMap((seriesId) => {
      const identifier = this.identifierById.get(seriesId);
      return identifier ? [identifier] : [];
    });
    if (identifiers.length === 0) return [];

    const trends = await this.client.getTrends(
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
  };

  getSeriesDetails: ChartDataAdapter['getSeriesDetails'] = (seriesId) =>
    Promise.resolve(this.definitionById.get(seriesId));

  getThresholds: ChartDataAdapter['getThresholds'] = (seriesIds) =>
    Promise.resolve(
      this.chartable
        .filter((timeseries) => seriesIds.includes(getTimeseriesKey(timeseries)))
        .flatMap(getTimeseriesThresholds),
    );

  getAlerts: ChartDataAdapter['getAlerts'] = () => Promise.resolve([]);

  getConnectedFiles: ChartDataAdapter['getConnectedFiles'] = () => Promise.resolve([]);

  getEvents: ChartDataAdapter['getEvents'] = () => Promise.resolve([]);
}

export function createTimeseriesChartAdapter(
  client: TimeseriesContextType,
  series: readonly AssetInstanceDetails[],
  options: TimeseriesChartAdapterOptions,
): ChartDataAdapter {
  return new CdfTimeseriesChartAdapter(client, series, options);
}
