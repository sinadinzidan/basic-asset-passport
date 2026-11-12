import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import { updateAssetNote } from '../../../services/assets/notes/assetNote';
import type { AssetIdentifier } from '../../../types/asset';
import type { NewAssetNote, NoteIdentifier } from '../../../types/note';
import { useAssetContext } from '../useAssetContext';

import { getAssetNotesQueryKey } from './useAssetNotes';

const defaultDeps = { updateAssetNote };

export type UseUpdateAssetNoteContextType = typeof defaultDeps;
export const UseUpdateAssetNoteContext = createContext<UseUpdateAssetNoteContextType>(defaultDeps);

export type UpdateAssetNoteRequest = {
  note: NoteIdentifier;
  input: NewAssetNote;
};

export function useUpdateAssetNote(assetIdentifier: AssetIdentifier) {
  const { updateAssetNote: updateNote } = useContext(UseUpdateAssetNoteContext);
  const client = useAssetContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ note, input }: UpdateAssetNoteRequest) => updateNote(client, note, input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: getAssetNotesQueryKey(client.project, assetIdentifier),
      }),
  });
}
