import { isNewAssetNoteValid } from '../../../../lib/noteInput';
import type { NewAssetNote } from '../../../../types/note';
import { useSelectedAsset } from '../../useSelectedAsset';
import { useAddAssetNote } from '../useAddAssetNote';

export function useAssetNoteAddViewModel() {
  const assetIdentifier = useSelectedAsset();
  const { addNote, isAdding, error, discardError } = useAddAssetNote(assetIdentifier);

  function canSave(note: NewAssetNote): boolean {
    return isNewAssetNoteValid(note) && !isAdding;
  }

  function save(note: NewAssetNote, onSaved: () => void): void {
    if (!canSave(note)) return;

    void addNote(note).then(onSaved, () => undefined);
  }

  return {
    isSaving: isAdding,
    saveErrorMessage: error?.message ?? null,
    canSave,
    save,
    discardSaveError: discardError,
  };
}
