import { IconPlus } from '@tabler/icons-react';
import { useState, type FormEvent } from 'react';

import {
  NOTE_ADD_DIALOG_TITLE,
  NOTE_ADD_HINT,
  NOTE_SAVE_ERROR_TITLE,
} from '../../../constants/notes';
import { AppAlertVariant } from '../../../enums/appAlertVariant';
import { useAssetNoteAddViewModel } from '../../../hooks/assets/notes/useAssetNoteAddViewModel';
import type { AssetIdentifier } from '../../../types/asset';
import { AppAlert } from '../../general/AppAlert';
import { GeneralButton } from '../../general/GeneralButton';
import { GeneralDialog } from '../../general/GeneralDialog';

import { AssetNoteFields } from './AssetNoteFields';

const ADD_NOTE_FORM_ID = 'add-note-form';

type AssetNoteAddProps = {
  assetIdentifier: AssetIdentifier;
};

export function AssetNoteAdd({ assetIdentifier }: AssetNoteAddProps) {
  const { isSaving, saveErrorMessage, canSave, save, discardSaveError } =
    useAssetNoteAddViewModel(assetIdentifier);

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const canSubmit = canSave({ title, body });

  function handleOpenChange(isNextOpen: boolean): void {
    setIsOpen(isNextOpen);
    if (isNextOpen) return;

    setTitle('');
    setBody('');
    discardSaveError();
  }

  function handleAddClick(): void {
    handleOpenChange(true);
  }

  function handleCancelClick(): void {
    handleOpenChange(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    save({ title, body }, () => handleOpenChange(false));
  }

  return (
    <section aria-label="Add a note" className="data-card flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{NOTE_ADD_HINT}</p>
        <GeneralButton onClick={handleAddClick}>
          <IconPlus aria-hidden className="size-4" />
          Add note
        </GeneralButton>
      </div>
      <GeneralDialog
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
        title={NOTE_ADD_DIALOG_TITLE}
        footer={
          <>
            <GeneralButton disabled={isSaving} onClick={handleCancelClick} variant="outline">
              Cancel
            </GeneralButton>
            <GeneralButton disabled={!canSubmit} form={ADD_NOTE_FORM_ID} type="submit">
              {isSaving ? 'Saving...' : 'Save note'}
            </GeneralButton>
          </>
        }
      >
        <form className="flex flex-col gap-4" id={ADD_NOTE_FORM_ID} onSubmit={handleSubmit}>
          <AssetNoteFields
            idPrefix="note"
            title={title}
            body={body}
            onTitleChange={setTitle}
            onBodyChange={setBody}
          />
          {saveErrorMessage !== null ? (
            <AppAlert variant={AppAlertVariant.ERROR} title={NOTE_SAVE_ERROR_TITLE}>
              {saveErrorMessage}
            </AppAlert>
          ) : null}
        </form>
      </GeneralDialog>
    </section>
  );
}
