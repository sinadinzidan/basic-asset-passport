import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import { deleteAssetNote } from '../../../services/assets/notes/assetNoteService';
import type { AssetIdentifier } from '../../../types/asset';
import type { NoteIdentifier } from '../../../types/note';
import { useAssetDataClient } from '../useAssetDataClient';

import { getAssetNotesQueryKey } from './useAssetNotes';

const defaultDeps = { useAssetDataClient, deleteAssetNote };

export type UseDeleteAssetNoteContextType = typeof defaultDeps;
export const UseDeleteAssetNoteContext =
  createContext<UseDeleteAssetNoteContextType>(defaultDeps);

export function useDeleteAssetNote(assetIdentifier: AssetIdentifier) {
  const { useAssetDataClient: useClient, deleteAssetNote: deleteNote } =
    useContext(UseDeleteAssetNoteContext);
  const client = useClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (note: NoteIdentifier) => deleteNote(client, note),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: getAssetNotesQueryKey(client.project, assetIdentifier),
      }),
  });
}
