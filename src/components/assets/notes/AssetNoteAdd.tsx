import { IconPlus } from '@tabler/icons-react';
import { useState, type FormEvent } from 'react';

import { NOTE_BODY_MAX_LENGTH, NOTE_SAVE_ERROR_TITLE } from '../../../constants/notes';
import { AppAlertVariant } from '../../../enums/appAlertVariant';
import { useAddAssetNote } from '../../../hooks/assets/notes/useAddAssetNote';
import { isNewAssetNoteValid } from '../../../lib/noteInput';
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
  const { mutate, reset, isPending, isError, error } = useAddAssetNote(assetIdentifier);

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const canSubmit = isNewAssetNoteValid({ title, body }) && !isPending;

  function handleOpenChange(isNextOpen: boolean): void {
    setIsOpen(isNextOpen);
    if (isNextOpen) return;

    setTitle('');
    setBody('');
    reset();
  }

  function handleAddClick(): void {
    handleOpenChange(true);
  }

  function handleCancelClick(): void {
    handleOpenChange(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!canSubmit) return;

    mutate({ title, body }, { onSuccess: () => handleOpenChange(false) });
  }

  return (
    <section aria-label="Add a note" className="data-card flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Add a note with a title and up to {NOTE_BODY_MAX_LENGTH} characters of text.
        </p>
        <GeneralButton onClick={handleAddClick}>
          <IconPlus aria-hidden className="size-4" />
          Add note
        </GeneralButton>
      </div>
      <GeneralDialog
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
        title="Add note"
        footer={
          <>
            <GeneralButton disabled={isPending} onClick={handleCancelClick} variant="outline">
              Cancel
            </GeneralButton>
            <GeneralButton disabled={!canSubmit} form={ADD_NOTE_FORM_ID} type="submit">
              {isPending ? 'Saving...' : 'Save note'}
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
          {isError ? (
            <AppAlert variant={AppAlertVariant.ERROR} title={NOTE_SAVE_ERROR_TITLE}>
              {error.message}
            </AppAlert>
          ) : null}
        </form>
      </GeneralDialog>
    </section>
  );
}
