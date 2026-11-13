import type { NewAssetNote, NoteIdentifier } from '../../../types/note';
import { useSelectedAsset } from '../useSelectedAsset';

import { useUpdateAssetNote } from './useUpdateAssetNote';

export function useAssetNoteItemViewModel({ space, externalId }: NoteIdentifier) {
  const assetIdentifier = useSelectedAsset();
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
