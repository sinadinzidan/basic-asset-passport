import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import { COUNT_QUERY_KEY_PART, COUNT_QUERY_STALE_TIME_MS } from '../../constants/assets';
import { toCountState } from '../../lib/countBadge';
import {
  countAssetDocuments,
  countAssetEquipment,
  countAssetLinkedFiles,
  countAssetNotes,
  countAssetTimeseries,
} from '../../services/assets/assetDetailsTabCounts';
import type { AssetIdentifier } from '../../types/asset';
import type { CountState } from '../../types/countState';

import { getAssetDocumentsQueryKey } from './documents/useAssetDocuments';
import { getAssetLinkedFilesQueryKey } from './documents/useAssetLinkedFiles';
import { getAssetEquipmentQueryKey } from './equipment/useAssetEquipment';
import { getAssetNotesQueryKey } from './notes/useAssetNotes';
import { getAssetTimeseriesQueryKey } from './timeseries/useAssetTimeseries';
import { useAssetContext } from './useAssetContext';

const defaultDeps = {
  countAssetEquipment,
  countAssetNotes,
  countAssetTimeseries,
  countAssetDocuments,
  countAssetLinkedFiles,
};

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
  const {
    countAssetEquipment: countEquipment,
    countAssetNotes: countNotes,
    countAssetTimeseries: countTimeseries,
    countAssetDocuments: countDocuments,
    countAssetLinkedFiles: countLinkedFiles,
  } = useContext(UseAssetDetailsTabCountsContext);
  const client = useAssetContext();

  const equipment = useQuery({
    queryKey: [...getAssetEquipmentQueryKey(client.project, assetIdentifier), COUNT_QUERY_KEY_PART],
    queryFn: () => countEquipment(client, assetIdentifier),
    staleTime: COUNT_QUERY_STALE_TIME_MS,
  });
  const notes = useQuery({
    queryKey: [...getAssetNotesQueryKey(client.project, assetIdentifier), COUNT_QUERY_KEY_PART],
    queryFn: () => countNotes(client, assetIdentifier),
    staleTime: COUNT_QUERY_STALE_TIME_MS,
  });
  const timeseries = useQuery({
    queryKey: [
      ...getAssetTimeseriesQueryKey(client.project, assetIdentifier),
      COUNT_QUERY_KEY_PART,
    ],
    queryFn: () => countTimeseries(client, assetIdentifier),
    staleTime: COUNT_QUERY_STALE_TIME_MS,
  });
  const documents = useQuery({
    queryKey: [...getAssetDocumentsQueryKey(client.project, assetIdentifier), COUNT_QUERY_KEY_PART],
    queryFn: () => countDocuments(client, assetIdentifier),
    staleTime: COUNT_QUERY_STALE_TIME_MS,
  });
  const linkedFiles = useQuery({
    queryKey: [
      ...getAssetLinkedFilesQueryKey(client.project, assetIdentifier),
      COUNT_QUERY_KEY_PART,
    ],
    queryFn: () => countLinkedFiles(client, assetIdentifier),
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
