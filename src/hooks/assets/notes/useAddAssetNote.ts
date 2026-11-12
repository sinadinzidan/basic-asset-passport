import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import {
  createAssetNoteService,
  type AssetNoteService,
} from '../../../services/assets/notes/assetNote';
import type { AssetIdentifier } from '../../../types/asset';
import type { AssetContextType } from '../../../types/assetContext';
import type { NewAssetNote } from '../../../types/note';
import { useAssetContext } from '../useAssetContext';

import { getAssetNotesQueryKey } from './useAssetNotes';

const defaultDeps: {
  createAssetNoteService: (client: AssetContextType) => Pick<AssetNoteService, 'createAssetNote'>;
} = { createAssetNoteService };

export type UseAddAssetNoteContextType = typeof defaultDeps;
export const UseAddAssetNoteContext = createContext<UseAddAssetNoteContextType>(defaultDeps);

export function useAddAssetNote(assetIdentifier: AssetIdentifier) {
  const { createAssetNoteService } = useContext(UseAddAssetNoteContext);
  const client = useAssetContext();
  const queryClient = useQueryClient();
  const noteService = createAssetNoteService(client);

  return useMutation({
    mutationFn: (note: NewAssetNote) => noteService.createAssetNote(assetIdentifier, note),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: getAssetNotesQueryKey(client.project, assetIdentifier),
      }),
  });
}
