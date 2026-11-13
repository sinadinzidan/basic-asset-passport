import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import { COUNT_QUERY_KEY_PART, COUNT_QUERY_STALE_TIME_MS } from '../../constants/assets';
import { toCountState } from '../../lib/countBadge';
import { createAssetSummaryService } from '../../services/assets/assetSummary';
import type { CountState } from '../../types/countState';

import { useAssetClient } from './useAssetClient';

const defaultDeps = { createAssetSummaryService };

export type UseAssetSummaryContextType = typeof defaultDeps;
export const UseAssetSummaryContext = createContext<UseAssetSummaryContextType>(defaultDeps);

type AssetSummaryCounts = {
  assets: CountState;
  operating: CountState;
  equipment: CountState;
  error: unknown;
  isRetrying: boolean;
  retry: () => void;
};

export function useAssetSummary(): AssetSummaryCounts {
  const { createAssetSummaryService } = useContext(UseAssetSummaryContext);
  const client = useAssetClient();
  const countService = createAssetSummaryService(client);

  const assets = useQuery({
    queryKey: getAssetSummaryQueryKey(client.project, 'assets'),
    queryFn: () => countService.countAllAssets(),
    staleTime: COUNT_QUERY_STALE_TIME_MS,
  });
  const operating = useQuery({
    queryKey: getAssetSummaryQueryKey(client.project, 'operating'),
    queryFn: () => countService.countOperatingAssets(),
    staleTime: COUNT_QUERY_STALE_TIME_MS,
  });
  const equipment = useQuery({
    queryKey: getAssetSummaryQueryKey(client.project, 'equipment'),
    queryFn: () => countService.countAllEquipment(),
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

function getAssetSummaryQueryKey(project: string, card: string) {
  return ['asset-summary', project, COUNT_QUERY_KEY_PART, card] as const;
}
