import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import {
  ASSET_PASSPORT_MODEL_EXTERNAL_ID,
  ASSET_PASSPORT_MODEL_SPACE,
  ASSET_PASSPORT_MODEL_VERSION,
} from '../../../constants/assets';
import {
  NOTE_QUERY_LIMIT,
  NOTE_QUERY_STALE_TIME_MS,
  NOTE_VIEW_EXTERNAL_ID,
} from '../../../constants/notes';
import { isKeyOfList } from '../../../lib/queryKeys';
import {
  createAssetNoteService,
  type AssetNoteService,
} from '../../../services/assets/notes/assetNote';
import type { AssetIdentifier } from '../../../types/asset';
import type { AssetContextType } from '../../../types/assetContext';
import { useAssetContext } from '../useAssetContext';

const defaultDeps: {
  createAssetNoteService: (client: AssetContextType) => Pick<AssetNoteService, 'listAssetNotes'>;
} = { createAssetNoteService };

export type UseAssetNotesContextType = typeof defaultDeps;
export const UseAssetNotesContext = createContext<UseAssetNotesContextType>(defaultDeps);

export function getAssetNotesQueryKey(project: string, assetIdentifier: AssetIdentifier) {
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

export function useAssetNotes(assetIdentifier: AssetIdentifier, limit: number = NOTE_QUERY_LIMIT) {
  const { createAssetNoteService } = useContext(UseAssetNotesContext);
  const client = useAssetContext();
  const noteService = createAssetNoteService(client);

  const listKey = getAssetNotesQueryKey(client.project, assetIdentifier);

  return useQuery({
    queryKey: [...listKey, limit],
    queryFn: () => noteService.listAssetNotes(assetIdentifier, limit),
    staleTime: NOTE_QUERY_STALE_TIME_MS,
    placeholderData: (previousData, previousQuery) =>
      isKeyOfList(previousQuery?.queryKey, listKey) ? previousData : undefined,
  });
}
