import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import { COUNT_QUERY_KEY_PART, COUNT_QUERY_STALE_TIME_MS } from '../../constants/assets';
import { toCountState } from '../../lib/countBadge';
import { createRegisterSummaryService } from '../../services/assets/registerSummary';
import type { CountState } from '../../types/countState';

import { useAssetClient } from './useAssetClient';

const defaultDeps = { createRegisterSummaryService };

export type UseRegisterSummaryContextType = typeof defaultDeps;
export const UseRegisterSummaryContext = createContext<UseRegisterSummaryContextType>(defaultDeps);

type RegisterSummaryCounts = {
  assets: CountState;
  operating: CountState;
  equipment: CountState;
  error: unknown;
  isRetrying: boolean;
  retry: () => void;
};

export function useRegisterSummary(): RegisterSummaryCounts {
  const { createRegisterSummaryService } = useContext(UseRegisterSummaryContext);
  const client = useAssetClient();
  const countService = createRegisterSummaryService(client);

  const assets = useQuery({
    queryKey: getRegisterSummaryQueryKey(client.project, 'assets'),
    queryFn: () => countService.countAllAssets(),
    staleTime: COUNT_QUERY_STALE_TIME_MS,
  });
  const operating = useQuery({
    queryKey: getRegisterSummaryQueryKey(client.project, 'operating'),
    queryFn: () => countService.countOperatingAssets(),
    staleTime: COUNT_QUERY_STALE_TIME_MS,
  });
  const equipment = useQuery({
    queryKey: getRegisterSummaryQueryKey(client.project, 'equipment'),
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

function getRegisterSummaryQueryKey(project: string, card: string) {
  return ['asset-register', project, COUNT_QUERY_KEY_PART, card] as const;
}
