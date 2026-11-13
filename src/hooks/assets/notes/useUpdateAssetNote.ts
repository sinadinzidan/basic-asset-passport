import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import { NOTE_UPDATED_MESSAGE } from '../../../constants/notes';
import {
  createAssetNoteService,
  type AssetNoteService,
} from '../../../services/assets/notes/assetNote';
import type { AssetIdentifier } from '../../../types/asset';
import type { AssetContextType } from '../../../types/assetContext';
import type { NewAssetNote, NoteIdentifier } from '../../../types/note';
import { useSuccessToast } from '../../general/useSuccessToast';
import { useAssetContext } from '../useAssetContext';

import { getAssetNotesQueryKey } from './useAssetNotes';

const defaultDeps: {
  createAssetNoteService: (client: AssetContextType) => Pick<AssetNoteService, 'updateAssetNote'>;
} = { createAssetNoteService };

export type UseUpdateAssetNoteContextType = typeof defaultDeps;
export const UseUpdateAssetNoteContext = createContext<UseUpdateAssetNoteContextType>(defaultDeps);

type UpdateAssetNoteRequest = {
  note: NoteIdentifier;
  input: NewAssetNote;
};

export function useUpdateAssetNote(assetIdentifier: AssetIdentifier) {
  const { createAssetNoteService } = useContext(UseUpdateAssetNoteContext);
  const client = useAssetContext();
  const queryClient = useQueryClient();
  const showSuccessToast = useSuccessToast();
  const noteService = createAssetNoteService(client);

  const mutation = useMutation({
    mutationFn: ({ note, input }: UpdateAssetNoteRequest) =>
      noteService.updateAssetNote(note, input),
    onSuccess: () => {
      showSuccessToast(NOTE_UPDATED_MESSAGE);
      return queryClient.invalidateQueries({
        queryKey: getAssetNotesQueryKey(client.project, assetIdentifier),
      });
    },
  });

  return {
    updateNote: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
    discardError: mutation.reset,
  };
}
