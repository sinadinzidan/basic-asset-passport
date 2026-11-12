import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import { COUNT_QUERY_KEY_PART, COUNT_QUERY_STALE_TIME_MS } from '../../constants/assets';
import { toCountState } from '../../lib/countBadge';
import {
  countAllAssets,
  countAllEquipment,
  countOperatingAssets,
} from '../../services/assets/assetsKPICounts';
import type { CountState } from '../../types/countState';

import { useAssetContext } from './useAssetContext';

const defaultDeps = {
  countAllAssets,
  countOperatingAssets,
  countAllEquipment,
};

export type UseAssetsKPICountsContextType = typeof defaultDeps;
export const UseAssetsKPICountsContext = createContext<UseAssetsKPICountsContextType>(defaultDeps);

type AssetsKPICounts = {
  assets: CountState;
  operating: CountState;
  equipment: CountState;
  error: unknown;
  isRetrying: boolean;
  retry: () => void;
};

export function useAssetsKPICounts(): AssetsKPICounts {
  const {
    countAllAssets: countAssets,
    countOperatingAssets: countOperating,
    countAllEquipment: countEquipment,
  } = useContext(UseAssetsKPICountsContext);
  const client = useAssetContext();

  const assets = useQuery({
    queryKey: getAssetsKPICountQueryKey(client.project, 'assets'),
    queryFn: () => countAssets(client),
    staleTime: COUNT_QUERY_STALE_TIME_MS,
  });
  const operating = useQuery({
    queryKey: getAssetsKPICountQueryKey(client.project, 'operating'),
    queryFn: () => countOperating(client),
    staleTime: COUNT_QUERY_STALE_TIME_MS,
  });
  const equipment = useQuery({
    queryKey: getAssetsKPICountQueryKey(client.project, 'equipment'),
    queryFn: () => countEquipment(client),
    staleTime: COUNT_QUERY_STALE_TIME_MS,
  });

  const failedCounts = [assets, operating, equipment].filter((count) => count.isError);

  function retry(): void {
    failedCounts.forEach((count) => void count.refetch());
  }

  return {
    assets: toCountState(assets),
    operating: toCountState(operating),
    equipment: toCountState(equipment),
    error: failedCounts[0]?.error ?? null,
    isRetrying: failedCounts.some((count) => count.isFetching),
    retry,
  };
}

function getAssetsKPICountQueryKey(project: string, card: string) {
  return ['asset-register', project, COUNT_QUERY_KEY_PART, card] as const;
}
