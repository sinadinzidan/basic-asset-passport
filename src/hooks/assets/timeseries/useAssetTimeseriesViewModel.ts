import { createContext, useContext, useMemo } from 'react';

import { TimeseriesPreviewKind } from '../../../enums/timeseriesPreviewKind';
import {
  getTimeseriesKey,
  getTimeseriesUnit,
  isNonNumericTimeseries,
} from '../../../lib/timeseriesProperties';
import type { AssetIdentifier, AssetInstanceDetails } from '../../../types/asset';
import type { TimeseriesPreview } from '../../../types/timeseries';

import { useAssetTimeseries } from './useAssetTimeseries';
import { useTimeseriesTrends } from './useTimeseriesTrends';

const defaultDeps = { useAssetTimeseries, useTimeseriesTrends };

type UseAssetTimeseriesViewModelContextType = typeof defaultDeps;
const UseAssetTimeseriesViewModelContext =
  createContext<UseAssetTimeseriesViewModelContextType>(defaultDeps);

const NO_TIMESERIES: AssetInstanceDetails[] = [];

export type AssetTimeseriesItem = {
  timeseries: AssetInstanceDetails;
  unit: string | null;
  preview: TimeseriesPreview;
};

export function useAssetTimeseriesViewModel(assetIdentifier: AssetIdentifier, limit?: number) {
  const { useAssetTimeseries: useSeries, useTimeseriesTrends: useTrends } = useContext(
    UseAssetTimeseriesViewModelContext,
  );
  const series = useSeries(assetIdentifier, limit);

  const allTimeseries = series.data?.items ?? NO_TIMESERIES;
  const trends = useTrends(
    allTimeseries
      .filter((timeseries) => !isNonNumericTimeseries(timeseries))
      .map(({ space, externalId }) => ({ space, externalId })),
  );

  const { data: trendData, isError: isTrendError, isPending: isTrendPending } = trends;

  const items = useMemo(
    () =>
      allTimeseries.map((timeseries): AssetTimeseriesItem => ({
        timeseries,
        unit: getTimeseriesUnit(timeseries),
        preview: getPreview(timeseries, {
          data: trendData,
          isError: isTrendError,
          isPending: isTrendPending,
        }),
      })),
    [allTimeseries, trendData, isTrendError, isTrendPending],
  );

  return {
    items,
    timeseries: allTimeseries,
    hasMore: series.data?.hasMore ?? false,
    isLoadingMore: series.isLoadingMore,
    isPending: series.isPending,
    isError: series.isError,
    error: series.error,
    isFetching: series.isFetching,
    retry: series.retry,
  };
}

function getPreview(
  timeseries: AssetInstanceDetails,
  trends: Pick<ReturnType<typeof useTimeseriesTrends>, 'data' | 'isError' | 'isPending'>,
): TimeseriesPreview {
  if (isNonNumericTimeseries(timeseries)) return { kind: TimeseriesPreviewKind.NON_NUMERIC };
  if (trends.isError) return { kind: TimeseriesPreviewKind.UNAVAILABLE };
  if (trends.isPending) return { kind: TimeseriesPreviewKind.LOADING };

  const trend = trends.data?.get(getTimeseriesKey(timeseries));
  if (trend?.hasFailed) return { kind: TimeseriesPreviewKind.UNAVAILABLE };

  const points = trend?.points ?? [];
  return points.length > 0
    ? { kind: TimeseriesPreviewKind.READY, points }
    : { kind: TimeseriesPreviewKind.EMPTY };
}
