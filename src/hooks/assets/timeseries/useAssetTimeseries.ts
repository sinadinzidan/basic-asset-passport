import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import {
  ASSET_PASSPORT_MODEL_EXTERNAL_ID,
  ASSET_PASSPORT_MODEL_SPACE,
  ASSET_PASSPORT_MODEL_VERSION,
} from '../../../constants/assets';
import {
  TIMESERIES_QUERY_LIMIT,
  TIMESERIES_QUERY_STALE_TIME_MS,
  TIMESERIES_VIEW_EXTERNAL_ID,
} from '../../../constants/timeseries';
import { isKeyOfList } from '../../../lib/queryKeys';
import { createAssetTimeseriesService } from '../../../services/assets/timeseries/assetTimeseries';
import type { AssetIdentifier } from '../../../types/asset';
import { useAssetContext } from '../useAssetContext';

const defaultDeps = { createAssetTimeseriesService };

export type UseAssetTimeseriesContextType = typeof defaultDeps;
export const UseAssetTimeseriesContext = createContext<UseAssetTimeseriesContextType>(defaultDeps);

export function getAssetTimeseriesQueryKey(project: string, assetIdentifier: AssetIdentifier) {
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

export function useAssetTimeseries(
  assetIdentifier: AssetIdentifier,
  limit: number = TIMESERIES_QUERY_LIMIT,
) {
  const { createAssetTimeseriesService } = useContext(UseAssetTimeseriesContext);
  const client = useAssetContext();
  const timeseriesService = createAssetTimeseriesService(client);

  const listKey = getAssetTimeseriesQueryKey(client.project, assetIdentifier);

  return useQuery({
    queryKey: [...listKey, limit],
    queryFn: () => timeseriesService.listAssetTimeseries(assetIdentifier, limit),
    staleTime: TIMESERIES_QUERY_STALE_TIME_MS,
    placeholderData: (previousData, previousQuery) =>
      isKeyOfList(previousQuery?.queryKey, listKey) ? previousData : undefined,
  });
}
