import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import { NOTE_DELETED_MESSAGE } from '../../../constants/notes';
import {
  createAssetNoteService,
  type AssetNoteService,
} from '../../../services/assets/notes/assetNote';
import type { AssetIdentifier } from '../../../types/asset';
import type { AssetContextType } from '../../../types/assetContext';
import type { NoteIdentifier } from '../../../types/note';
import { useSuccessToast } from '../../general/useSuccessToast';
import { useAssetClient } from '../useAssetClient';

import { getAssetNotesQueryKey } from './useAssetNotes';

const defaultDeps: {
  createAssetNoteService: (client: AssetContextType) => Pick<AssetNoteService, 'deleteAssetNote'>;
} = { createAssetNoteService };

export type UseDeleteAssetNoteContextType = typeof defaultDeps;
export const UseDeleteAssetNoteContext = createContext<UseDeleteAssetNoteContextType>(defaultDeps);

export function useDeleteAssetNote(assetIdentifier: AssetIdentifier) {
  const { createAssetNoteService } = useContext(UseDeleteAssetNoteContext);
  const client = useAssetClient();
  const queryClient = useQueryClient();
  const showSuccessToast = useSuccessToast();
  const noteService = createAssetNoteService(client);

  const mutation = useMutation({
    mutationFn: (note: NoteIdentifier) => noteService.deleteAssetNote(note),
    onSuccess: () => {
      showSuccessToast(NOTE_DELETED_MESSAGE);

      return queryClient.invalidateQueries({
        queryKey: getAssetNotesQueryKey(client.project, assetIdentifier),
      });
    },
  });

  return {
    deleteNote: mutation.mutateAsync,
    deletingNote: mutation.isPending ? mutation.variables : null,
    error: mutation.error,
  };
}
