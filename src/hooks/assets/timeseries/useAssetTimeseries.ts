import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import { MODEL } from '../../../config/model';
import {
  TIMESERIES_QUERY_LIMIT,
  TIMESERIES_QUERY_STALE_TIME_MS,
} from '../../../constants/timeseries';
import { isKeyOfList } from '../../../lib/queryKeys';
import { listAssetTimeseries } from '../../../services/assets/timeseries/assetTimeseries';
import type { AssetIdentifier } from '../../../types/asset';
import { useAssetContext } from '../useAssetContext';

const defaultDeps = { listAssetTimeseries };

export type UseAssetTimeseriesContextType = typeof defaultDeps;
export const UseAssetTimeseriesContext = createContext<UseAssetTimeseriesContextType>(defaultDeps);

export function getAssetTimeseriesQueryKey(project: string, assetIdentifier: AssetIdentifier) {
  return [
    'asset-timeseries',
    project,
    MODEL.space,
    MODEL.externalId,
    MODEL.version,
    MODEL.views.timeseries,
    assetIdentifier.space,
    assetIdentifier.externalId,
  ];
}

export function useAssetTimeseries(
  assetIdentifier: AssetIdentifier,
  limit: number = TIMESERIES_QUERY_LIMIT,
) {
  const { listAssetTimeseries: loadTimeseries } = useContext(UseAssetTimeseriesContext);
  const client = useAssetContext();

  const listKey = getAssetTimeseriesQueryKey(client.project, assetIdentifier);

  return useQuery({
    queryKey: [...listKey, limit],
    queryFn: () => loadTimeseries(client, assetIdentifier, limit),
    staleTime: TIMESERIES_QUERY_STALE_TIME_MS,
    placeholderData: (previousData, previousQuery) =>
      isKeyOfList(previousQuery?.queryKey, listKey) ? previousData : undefined,
  });
}
