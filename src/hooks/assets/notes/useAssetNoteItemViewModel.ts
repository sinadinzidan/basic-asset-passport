import type { AssetIdentifier } from '../../../types/asset';
import type { NewAssetNote, NoteIdentifier } from '../../../types/note';

import { useUpdateAssetNote } from './useUpdateAssetNote';

export function useAssetNoteItemViewModel(
  assetIdentifier: AssetIdentifier,
  { space, externalId }: NoteIdentifier,
) {
  const { updateNote, isUpdating, error, discardError } = useUpdateAssetNote(assetIdentifier);

  function save(input: NewAssetNote, onSaved: () => void): void {
    void updateNote({ note: { space, externalId }, input }).then(onSaved, () => undefined);
  }

  return {
    isSaving: isUpdating,
    saveErrorMessage: error?.message ?? null,
    save,
    discardSaveError: discardError,
  };
}
