import type { AssetIdentifier } from '../../../types/asset';
import type { NewAssetNote, NoteIdentifier } from '../../../types/note';

import { useUpdateAssetNote } from './useUpdateAssetNote';

export function useAssetNoteItemViewModel(
  assetIdentifier: AssetIdentifier,
  { space, externalId }: NoteIdentifier,
) {
  const updateMutation = useUpdateAssetNote(assetIdentifier);

  function save(input: NewAssetNote, onSaved: () => void): void {
    updateMutation.mutate({ note: { space, externalId }, input }, { onSuccess: onSaved });
  }

  return {
    isSaving: updateMutation.isPending,
    saveErrorMessage: updateMutation.isError ? updateMutation.error.message : null,
    save,
    discardSaveError: updateMutation.reset,
  };
}
