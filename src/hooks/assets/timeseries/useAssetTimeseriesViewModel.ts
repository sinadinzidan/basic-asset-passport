import { createContext, useContext } from 'react';

import {
  getTimeseriesKey,
  getTimeseriesUnit,
  isNonNumericTimeseries,
} from '../../../lib/timeseriesProperties';
import type {
  AssetIdentifier,
  AssetInstanceDetails,
} from '../../../types/asset';
import type { TimeseriesPreview } from '../../../types/timeseries';
import { useTimeseriesTrends } from '../../timeseries/useTimeseriesTrends';

import { useAssetTimeseries } from './useAssetTimeseries';

const defaultDeps = { useAssetTimeseries, useTimeseriesTrends };

export type UseAssetTimeseriesViewModelContextType = typeof defaultDeps;
export const UseAssetTimeseriesViewModelContext =
  createContext<UseAssetTimeseriesViewModelContextType>(defaultDeps);

export type AssetTimeseriesItem = {
  timeseries: AssetInstanceDetails;
  unit: string | null;
  preview: TimeseriesPreview;
};

/**
 * The series of an asset, each with what its preview should show. Non-numeric series
 * have no trend to draw, so only the numeric ones are read.
 */
export function useAssetTimeseriesViewModel(assetIdentifier: AssetIdentifier) {
  const { useAssetTimeseries: useSeries, useTimeseriesTrends: useTrends } =
    useContext(UseAssetTimeseriesViewModelContext);
  const series = useSeries(assetIdentifier);
  const allTimeseries = series.data ?? [];
  const numericTimeseries = allTimeseries.filter(
    (timeseries) => !isNonNumericTimeseries(timeseries),
  );
  const trends = useTrends(
    numericTimeseries.map(({ space, externalId }) => ({ space, externalId })),
  );

  const items = allTimeseries.map((timeseries): AssetTimeseriesItem => ({
    timeseries,
    unit: getTimeseriesUnit(timeseries),
    preview: getPreview(timeseries, trends),
  }));

  return {
    items,
    isPending: series.isPending,
    isError: series.isError,
    isFetching: series.isFetching,
    retry: () => void series.refetch(),
  };
}

function getPreview(
  timeseries: AssetInstanceDetails,
  trends: ReturnType<typeof useTimeseriesTrends>,
): TimeseriesPreview {
  if (isNonNumericTimeseries(timeseries)) return { kind: 'NON_NUMERIC' };
  if (trends.isError) return { kind: 'UNAVAILABLE' };
  if (trends.isPending) return { kind: 'LOADING' };

  const points = trends.data?.get(getTimeseriesKey(timeseries)) ?? [];
  return points.length > 0 ? { kind: 'READY', points } : { kind: 'EMPTY' };
}
