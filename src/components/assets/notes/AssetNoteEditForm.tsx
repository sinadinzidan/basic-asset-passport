import { useState, type FormEvent } from 'react';

import { NOTE_SAVE_ERROR_TITLE } from '../../../constants/notes';
import { AppAlertVariant } from '../../../enums/appAlertVariant';
import { isNewAssetNoteValid } from '../../../lib/noteInput';
import type { AssetNote, NewAssetNote } from '../../../types/note';
import { AppAlert, GeneralButton } from '../../general';

import { AssetNoteFields } from './AssetNoteFields';

type AssetNoteEditFormProps = {
  note: AssetNote;
  isSaving: boolean;
  errorMessage: string | null;
  onSave: (input: NewAssetNote) => void;
  onCancel: () => void;
};

export function AssetNoteEditForm({
  note,
  isSaving,
  errorMessage,
  onSave,
  onCancel,
}: AssetNoteEditFormProps) {
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body ?? '');

  const canSave = isNewAssetNoteValid({ title, body }) && !isSaving;

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (canSave) onSave({ title, body });
  }

  return (
    <form className="flex flex-col gap-4 p-4" onSubmit={handleSubmit}>
      <AssetNoteFields
        idPrefix={`note-edit-${note.externalId}`}
        title={title}
        body={body}
        onTitleChange={setTitle}
        onBodyChange={setBody}
      />
      {errorMessage !== null ? (
        <AppAlert variant={AppAlertVariant.ERROR} title={NOTE_SAVE_ERROR_TITLE}>
          {errorMessage}
        </AppAlert>
      ) : null}
      <div className="flex items-center gap-2">
        <GeneralButton disabled={!canSave} type="submit">
          {isSaving ? 'Saving...' : 'Save'}
        </GeneralButton>
        <GeneralButton disabled={isSaving} onClick={onCancel} type="button" variant="outline">
          Cancel
        </GeneralButton>
      </div>
    </form>
  );
}
