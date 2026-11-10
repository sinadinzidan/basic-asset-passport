import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import {
  ASSET_PASSPORT_MODEL_EXTERNAL_ID,
  ASSET_PASSPORT_MODEL_SPACE,
  ASSET_PASSPORT_MODEL_VERSION,
} from '../../../constants/assets';
import {
  TIMESERIES_QUERY_STALE_TIME_MS,
  TIMESERIES_VIEW_EXTERNAL_ID,
} from '../../../constants/timeseries';
import { listAssetTimeseries } from '../../../services/assets/timeseries/assetTimeseriesService';
import type { AssetIdentifier } from '../../../types/asset';
import { useAssetDataClient } from '../useAssetDataClient';

const defaultDeps = { useAssetDataClient, listAssetTimeseries };

export type UseAssetTimeseriesContextType = typeof defaultDeps;
export const UseAssetTimeseriesContext =
  createContext<UseAssetTimeseriesContextType>(defaultDeps);

export function getAssetTimeseriesQueryKey(
  project: string,
  assetIdentifier: AssetIdentifier,
) {
  return [
    'asset-timeseries',
    project,
    ASSET_PASSPORT_MODEL_SPACE,
    ASSET_PASSPORT_MODEL_EXTERNAL_ID,
    ASSET_PASSPORT_MODEL_VERSION,
    TIMESERIES_VIEW_EXTERNAL_ID,
    assetIdentifier.space,
    assetIdentifier.externalId,
  ];
}

export function useAssetTimeseries(assetIdentifier: AssetIdentifier) {
  const { useAssetDataClient: useClient, listAssetTimeseries: loadTimeseries } =
    useContext(UseAssetTimeseriesContext);
  const client = useClient();

  return useQuery({
    queryKey: getAssetTimeseriesQueryKey(client.project, assetIdentifier),
    queryFn: () => loadTimeseries(client, assetIdentifier),
    staleTime: TIMESERIES_QUERY_STALE_TIME_MS,
  });
}
