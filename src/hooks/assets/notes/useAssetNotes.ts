import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import { MODEL } from '../../../config/model';
import { NOTE_QUERY_LIMIT, NOTE_QUERY_STALE_TIME_MS } from '../../../constants/notes';
import { isKeyOfList } from '../../../lib/queryKeys';
import { toQueryState } from '../../../lib/queryState';
import {
  createAssetNoteService,
  type AssetNoteService,
} from '../../../services/assets/notes/assetNote';
import type { AssetIdentifier } from '../../../types/asset';
import type { AssetContextType } from '../../../types/assetContext';
import { useAssetClient } from '../useAssetClient';

const defaultDeps: {
  createAssetNoteService: (client: AssetContextType) => Pick<AssetNoteService, 'listAssetNotes'>;
} = { createAssetNoteService };

export type UseAssetNotesContextType = typeof defaultDeps;
export const UseAssetNotesContext = createContext<UseAssetNotesContextType>(defaultDeps);

export function getAssetNotesQueryKey(project: string, assetIdentifier: AssetIdentifier) {
  return [
    'asset-notes',
    project,
    MODEL.space,
    MODEL.externalId,
    MODEL.version,
    MODEL.views.note,
    assetIdentifier.space,
    assetIdentifier.externalId,
  ];
}

export function useAssetNotes(assetIdentifier: AssetIdentifier, limit: number = NOTE_QUERY_LIMIT) {
  const { createAssetNoteService } = useContext(UseAssetNotesContext);
  const client = useAssetClient();
  const noteService = createAssetNoteService(client);

  const listKey = getAssetNotesQueryKey(client.project, assetIdentifier);

  const query = useQuery({
    queryKey: [...listKey, limit],
    queryFn: () => noteService.listAssetNotes(assetIdentifier, limit),
    staleTime: NOTE_QUERY_STALE_TIME_MS,
    placeholderData: (previousData, previousQuery) =>
      isKeyOfList(previousQuery?.queryKey, listKey) ? previousData : undefined,
  });

  return toQueryState(query);
}
