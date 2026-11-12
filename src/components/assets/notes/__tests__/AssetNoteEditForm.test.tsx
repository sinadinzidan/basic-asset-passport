import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { makeAssetNote } from '../../../../mocks/notes';
import type { AssetNote, NewAssetNote } from '../../../../types/note';
import { AssetNoteEditForm } from '../AssetNoteEditForm';

type FormOptions = {
  note?: AssetNote;
  isSaving?: boolean;
  errorMessage?: string | null;
};

describe(AssetNoteEditForm.name, () => {
  function renderForm({
    note = makeAssetNote(),
    isSaving = false,
    errorMessage = null,
  }: FormOptions = {}) {
    const onSave = vi.fn<(input: NewAssetNote) => void>();
    const onCancel = vi.fn();
    render(
      <AssetNoteEditForm
        note={note}
        isSaving={isSaving}
        errorMessage={errorMessage}
        onSave={onSave}
        onCancel={onCancel}
      />,
    );

    return { onSave, onCancel };
  }

  it('starts with the title and text of the note', () => {
    renderForm();

    expect(screen.getByLabelText(/Title/)).toHaveValue('Seal inspection');
    expect(screen.getByLabelText('Note')).toHaveValue('Mechanical seal checked, no leaks.');
  });

  it('starts with an empty text for a note without one', () => {
    renderForm({ note: makeAssetNote({ body: null }) });

    expect(screen.getByLabelText('Note')).toHaveValue('');
  });

  it('saves what was typed', async () => {
    const user = userEvent.setup();
    const { onSave } = renderForm();
    await user.clear(screen.getByLabelText(/Title/));
    await user.type(screen.getByLabelText(/Title/), 'Bearing check');
    await user.clear(screen.getByLabelText('Note'));
    await user.type(screen.getByLabelText('Note'), 'Runs warm.');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledExactlyOnceWith({ title: 'Bearing check', body: 'Runs warm.' });
  });

  it('cannot save without a title', async () => {
    const user = userEvent.setup();
    const { onSave } = renderForm();

    await user.clear(screen.getByLabelText(/Title/));
    await user.type(screen.getByLabelText(/Title/), '   {Enter}');

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('locks both buttons and says it is saving while the save runs', () => {
    renderForm({ isSaving: true });

    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  it('shows why the save failed', () => {
    renderForm({ errorMessage: 'No write access.' });

    expect(screen.getByRole('alert')).toHaveTextContent('The note could not be saved');
    expect(screen.getByRole('alert')).toHaveTextContent('No write access.');
  });

  it('shows no error while nothing failed', () => {
    renderForm();

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('asks to cancel without saving', async () => {
    const user = userEvent.setup();
    const { onSave, onCancel } = renderForm();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });
});
