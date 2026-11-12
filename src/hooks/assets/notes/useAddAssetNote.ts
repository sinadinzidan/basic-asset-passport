import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import { createAssetNote } from '../../../services/assets/notes/assetNote';
import type { AssetIdentifier } from '../../../types/asset';
import type { NewAssetNote } from '../../../types/note';
import { useAssetContext } from '../useAssetContext';

import { getAssetNotesQueryKey } from './useAssetNotes';

const defaultDeps = { createAssetNote };

export type UseAddAssetNoteContextType = typeof defaultDeps;
export const UseAddAssetNoteContext = createContext<UseAddAssetNoteContextType>(defaultDeps);

export function useAddAssetNote(assetIdentifier: AssetIdentifier) {
  const { createAssetNote: createNote } = useContext(UseAddAssetNoteContext);
  const client = useAssetContext();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (note: NewAssetNote) => createNote(client, assetIdentifier, note),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: getAssetNotesQueryKey(client.project, assetIdentifier),
      }),
  });

  return {
    addNote: mutation.mutateAsync,
    isAdding: mutation.isPending,
    error: mutation.error,
    discardError: mutation.reset,
  };
}
