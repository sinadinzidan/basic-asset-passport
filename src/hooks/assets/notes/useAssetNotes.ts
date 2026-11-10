import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import {
  ASSET_PASSPORT_MODEL_EXTERNAL_ID,
  ASSET_PASSPORT_MODEL_SPACE,
  ASSET_PASSPORT_MODEL_VERSION,
} from '../../../constants/assets';
import {
  NOTE_QUERY_STALE_TIME_MS,
  NOTE_VIEW_EXTERNAL_ID,
} from '../../../constants/notes';
import { listAssetNotes } from '../../../services/assets/notes/assetNoteService';
import type { AssetIdentifier } from '../../../types/asset';
import { useAssetDataClient } from '../useAssetDataClient';

const defaultDeps = { useAssetDataClient, listAssetNotes };

export type UseAssetNotesContextType = typeof defaultDeps;
export const UseAssetNotesContext =
  createContext<UseAssetNotesContextType>(defaultDeps);

export function getAssetNotesQueryKey(
  project: string,
  assetIdentifier: AssetIdentifier,
) {
  return [
    'asset-notes',
    project,
    ASSET_PASSPORT_MODEL_SPACE,
    ASSET_PASSPORT_MODEL_EXTERNAL_ID,
    ASSET_PASSPORT_MODEL_VERSION,
    NOTE_VIEW_EXTERNAL_ID,
    assetIdentifier.space,
    assetIdentifier.externalId,
  ];
}

export function useAssetNotes(assetIdentifier: AssetIdentifier) {
  const { useAssetDataClient: useClient, listAssetNotes: loadNotes } =
    useContext(UseAssetNotesContext);
  const client = useClient();

  return useQuery({
    queryKey: getAssetNotesQueryKey(client.project, assetIdentifier),
    queryFn: () => loadNotes(client, assetIdentifier),
    staleTime: NOTE_QUERY_STALE_TIME_MS,
  });
}
