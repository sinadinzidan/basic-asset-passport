import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import { deleteAssetNote } from '../../../services/assets/notes/assetNote';
import type { AssetIdentifier } from '../../../types/asset';
import type { NoteIdentifier } from '../../../types/note';
import { useAssetContext } from '../useAssetContext';

import { getAssetNotesQueryKey } from './useAssetNotes';

const defaultDeps = { deleteAssetNote };

export type UseDeleteAssetNoteContextType = typeof defaultDeps;
export const UseDeleteAssetNoteContext = createContext<UseDeleteAssetNoteContextType>(defaultDeps);

export function useDeleteAssetNote(assetIdentifier: AssetIdentifier) {
  const { deleteAssetNote: deleteNote } = useContext(UseDeleteAssetNoteContext);
  const client = useAssetContext();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (note: NoteIdentifier) => deleteNote(client, note),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: getAssetNotesQueryKey(client.project, assetIdentifier),
      }),
  });

  return {
    deleteNote: mutation.mutateAsync,
    deletingNote: mutation.isPending ? mutation.variables : null,
    error: mutation.error,
  };
}
