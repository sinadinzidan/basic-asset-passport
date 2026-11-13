import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import { COUNT_QUERY_KEY_PART, COUNT_QUERY_STALE_TIME_MS } from '../../constants/assets';
import { toCountState } from '../../lib/countBadge';
import { createAssetDetailsTabCountService } from '../../services/assets/assetDetailsTabCounts';
import type { AssetIdentifier } from '../../types/asset';
import type { CountState } from '../../types/countState';

import { getAssetDocumentsQueryKey } from './documents/useAssetDocuments';
import { getAssetExistingFilesQueryKey } from './documents/useAssetExistingFiles';
import { getAssetEquipmentQueryKey } from './equipment/useAssetEquipment';
import { getAssetNotesQueryKey } from './notes/useAssetNotes';
import { getAssetTimeseriesQueryKey } from './timeseries/useAssetTimeseries';
import { useAssetClient } from './useAssetClient';

const defaultDeps = { createAssetDetailsTabCountService };

export type UseAssetDetailsTabCountsContextType = typeof defaultDeps;
export const UseAssetDetailsTabCountsContext =
  createContext<UseAssetDetailsTabCountsContextType>(defaultDeps);

export type AssetDetailsTabCounts = {
  equipment: CountState;
  timeseries: CountState;
  notes: CountState;
  documents: CountState;
};

export function useAssetDetailsTabCounts(assetIdentifier: AssetIdentifier): AssetDetailsTabCounts {
  const { createAssetDetailsTabCountService } = useContext(UseAssetDetailsTabCountsContext);
  const client = useAssetClient();
  const countService = createAssetDetailsTabCountService(client);

  const equipment = useQuery({
    queryKey: [...getAssetEquipmentQueryKey(client.project, assetIdentifier), COUNT_QUERY_KEY_PART],
    queryFn: () => countService.countAssetEquipment(assetIdentifier),
    staleTime: COUNT_QUERY_STALE_TIME_MS,
  });
  const notes = useQuery({
    queryKey: [...getAssetNotesQueryKey(client.project, assetIdentifier), COUNT_QUERY_KEY_PART],
    queryFn: () => countService.countAssetNotes(assetIdentifier),
    staleTime: COUNT_QUERY_STALE_TIME_MS,
  });
  const timeseries = useQuery({
    queryKey: [
      ...getAssetTimeseriesQueryKey(client.project, assetIdentifier),
      COUNT_QUERY_KEY_PART,
    ],
    queryFn: () => countService.countAssetTimeseries(assetIdentifier),
    staleTime: COUNT_QUERY_STALE_TIME_MS,
  });
  const documents = useQuery({
    queryKey: [...getAssetDocumentsQueryKey(client.project, assetIdentifier), COUNT_QUERY_KEY_PART],
    queryFn: () => countService.countAssetDocuments(assetIdentifier),
    staleTime: COUNT_QUERY_STALE_TIME_MS,
  });
  const linkedFiles = useQuery({
    queryKey: [
      ...getAssetExistingFilesQueryKey(client.project, assetIdentifier),
      COUNT_QUERY_KEY_PART,
    ],
    queryFn: () => countService.countAssetLinkedFiles(assetIdentifier),
    staleTime: COUNT_QUERY_STALE_TIME_MS,
  });

  return {
    equipment: toCountState(equipment),
    timeseries: toCountState(timeseries),
    notes: toCountState(notes),
    documents: {
      count:
        documents.data !== undefined && linkedFiles.data !== undefined
          ? documents.data + linkedFiles.data
          : null,
      isLoading: documents.isPending || linkedFiles.isPending,
    },
  };
}
