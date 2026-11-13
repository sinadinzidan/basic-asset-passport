import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import { NOTE_UPDATED_MESSAGE } from '../../../../constants/notes';
import {
  createAssetNoteService,
  type AssetNoteService,
} from '../../../../services/assets/notes/assetNote';
import type { AssetContextType } from '../../../../types/assetContext';
import type { NewAssetNote, NoteIdentifier } from '../../../../types/note';
import { useSuccessToast } from '../../../general/useSuccessToast';
import { useAssetClient } from '../../useAssetClient';
import { useSelectedAsset } from '../../useSelectedAsset';
import { getAssetNotesQueryKey } from '../useAssetNotes';

const defaultDeps: {
  createAssetNoteService: (client: AssetContextType) => Pick<AssetNoteService, 'updateAssetNote'>;
} = { createAssetNoteService };

export type UseAssetNoteItemViewModelContextType = typeof defaultDeps;
export const UseAssetNoteItemViewModelContext =
  createContext<UseAssetNoteItemViewModelContextType>(defaultDeps);

export function useAssetNoteItemViewModel({ space, externalId }: NoteIdentifier) {
  const { createAssetNoteService } = useContext(UseAssetNoteItemViewModelContext);
  const assetIdentifier = useSelectedAsset();
  const client = useAssetClient();
  const queryClient = useQueryClient();
  const showSuccessToast = useSuccessToast();
  const noteService = createAssetNoteService(client);

  const mutation = useMutation({
    mutationFn: (input: NewAssetNote) => noteService.updateAssetNote({ space, externalId }, input),
    onSuccess: () => {
      showSuccessToast(NOTE_UPDATED_MESSAGE);

      return queryClient.invalidateQueries({
        queryKey: getAssetNotesQueryKey(client.project, assetIdentifier),
      });
    },
  });

  function save(input: NewAssetNote, onSaved: () => void): void {
    void mutation.mutateAsync(input).then(onSaved, () => undefined);
  }

  return {
    isSaving: mutation.isPending,
    saveErrorMessage: mutation.error?.message ?? null,
    save,
    discardSaveError: mutation.reset,
  };
}
