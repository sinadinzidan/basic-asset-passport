import { isNewAssetNoteValid } from '../../../lib/noteInput';
import type { AssetIdentifier } from '../../../types/asset';
import type { NewAssetNote } from '../../../types/note';

import { useAddAssetNote } from './useAddAssetNote';

export function useAssetNoteAddViewModel(assetIdentifier: AssetIdentifier) {
  const { mutate, reset, isPending, isError, error } = useAddAssetNote(assetIdentifier);

  function canSave(note: NewAssetNote): boolean {
    return isNewAssetNoteValid(note) && !isPending;
  }

  function save(note: NewAssetNote, onSaved: () => void): void {
    if (!canSave(note)) return;

    mutate(note, { onSuccess: onSaved });
  }

  return {
    isSaving: isPending,
    saveErrorMessage: isError ? error.message : null,
    canSave,
    save,
    discardSaveError: reset,
  };
}
