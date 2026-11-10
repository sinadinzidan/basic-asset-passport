import { IconPlus } from '@tabler/icons-react';
import { useState, type FormEvent } from 'react';

import { NOTE_BODY_MAX_LENGTH } from '../../../constants/notes';
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

/** A bar with the add button; the note itself is written in a dialog. */
export function AssetNoteAdd({ assetIdentifier }: AssetNoteAddProps) {
  const { mutate, reset, isPending, isError, error } =
    useAddAssetNote(assetIdentifier);

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const canSubmit = isNewAssetNoteValid({ title, body }) && !isPending;

  function handleOpenChange(nextIsOpen: boolean): void {
    setIsOpen(nextIsOpen);
    if (nextIsOpen) return;

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

    mutate(
      { title, body },
      { onSuccess: () => handleOpenChange(false) },
    );
  }

  return (
    <section
      aria-label="Add a note"
      className="data-card flex flex-col gap-4 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Add a note with a title and up to {NOTE_BODY_MAX_LENGTH} characters of
          text.
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
            <GeneralButton
              disabled={isPending}
              onClick={handleCancelClick}
              variant="outline"
            >
              Cancel
            </GeneralButton>
            <GeneralButton
              disabled={!canSubmit}
              form={ADD_NOTE_FORM_ID}
              type="submit"
            >
              {isPending ? 'Saving...' : 'Save note'}
            </GeneralButton>
          </>
        }
      >
        <form
          className="flex flex-col gap-4"
          id={ADD_NOTE_FORM_ID}
          onSubmit={handleSubmit}
        >
          <AssetNoteFields
            idPrefix="note"
            title={title}
            body={body}
            onTitleChange={setTitle}
            onBodyChange={setBody}
          />
          {isError ? (
            <AppAlert variant="error" title="The note could not be saved">
              {error instanceof Error ? error.message : 'Try again.'}
            </AppAlert>
          ) : null}
        </form>
      </GeneralDialog>
    </section>
  );
}
