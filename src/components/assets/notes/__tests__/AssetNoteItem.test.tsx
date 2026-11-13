import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeMockClient } from '../../../../__mocks__/cogniteClient';
import { makeNavigationStore } from '../../../../__mocks__/navigation';
import { makeAssetNote } from '../../../../__mocks__/notes';
import { makeQueryClientWrapper } from '../../../../__mocks__/QueryClientWrapper';
import { UseAssetNoteItemViewModelContext } from '../../../../hooks/assets/notes/view-models/useAssetNoteItemViewModel';
import { AssetClientContext } from '../../../../hooks/assets/useAssetClient';
import { NavigationStoreContext } from '../../../../hooks/general/useNavigationState';
import type { AssetNoteService } from '../../../../services/assets/notes/assetNote';
import type { AssetNote } from '../../../../types/note';
import { AssetNoteItem } from '../AssetNoteItem';

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };

const navigationStore = makeNavigationStore({ selectedAsset: assetIdentifier });

type ItemOptions = {
  note?: AssetNote;
  isDeleting?: boolean;
};

describe(AssetNoteItem.name, () => {
  const client = makeMockClient();
  let updateContext: Pick<AssetNoteService, 'updateAssetNote'>;
  let onDelete: (note: AssetNote) => Promise<void>;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    updateContext = { updateAssetNote: vi.fn(() => Promise.resolve()) };
    onDelete = vi.fn(() => Promise.resolve());
    const QueryWrapper = makeQueryClientWrapper();

    wrapper = ({ children }) => (
      <UseAssetNoteItemViewModelContext.Provider
        value={{ createAssetNoteService: () => updateContext }}
      >
        <QueryWrapper>
          <AssetClientContext.Provider value={client}>
            <NavigationStoreContext.Provider value={navigationStore}>
              {children}
            </NavigationStoreContext.Provider>
          </AssetClientContext.Provider>
        </QueryWrapper>
      </UseAssetNoteItemViewModelContext.Provider>
    );
  });

  function renderItem({ note = makeAssetNote(), isDeleting = false }: ItemOptions = {}) {
    return render(<AssetNoteItem note={note} isDeleting={isDeleting} onDelete={onDelete} />, {
      wrapper,
    });
  }

  it('shows the title, text, author and date of the note', () => {
    renderItem();

    expect(screen.getByRole('heading', { name: 'Seal inspection' })).toBeInTheDocument();
    expect(screen.getByText('Mechanical seal checked, no leaks.')).toBeInTheDocument();
    expect(screen.getByText('Sam Operator · 5 Nov 2026')).toBeInTheDocument();
  });

  it('says the author is unknown and shows no text for a note without them', () => {
    renderItem({ note: makeAssetNote({ author: null, body: null }) });

    expect(screen.getByText('Unknown author · 5 Nov 2026')).toBeInTheDocument();
    expect(screen.queryByText('Mechanical seal checked, no leaks.')).not.toBeInTheDocument();
  });

  it('names its edit and delete buttons after the note', () => {
    renderItem();

    expect(screen.getByRole('button', { name: 'Edit Seal inspection' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Delete Seal inspection' })).toBeEnabled();
  });

  it('locks both buttons while the note is being deleted', () => {
    renderItem({ isDeleting: true });

    expect(screen.getByRole('button', { name: 'Edit Seal inspection' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete Seal inspection' })).toBeDisabled();
  });

  it('turns into a form holding the note when it is edited', async () => {
    const user = userEvent.setup();

    renderItem();

    await user.click(screen.getByRole('button', { name: 'Edit Seal inspection' }));

    expect(screen.getByLabelText(/Title/)).toHaveValue('Seal inspection');
    expect(screen.queryByRole('button', { name: 'Edit Seal inspection' })).not.toBeInTheDocument();
  });

  it('writes the edit to that note and goes back to showing it', async () => {
    const user = userEvent.setup();

    renderItem();
    await user.click(screen.getByRole('button', { name: 'Edit Seal inspection' }));
    await user.clear(screen.getByLabelText(/Title/));
    await user.type(screen.getByLabelText(/Title/), 'Bearing check');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(updateContext.updateAssetNote).toHaveBeenCalledExactlyOnceWith(
        { space: 'sp-asset-passport-data', externalId: 'note-1' },
        { title: 'Bearing check', body: 'Mechanical seal checked, no leaks.' },
      ),
    );
    expect(await screen.findByRole('button', { name: 'Edit Seal inspection' })).toBeInTheDocument();
  });

  it('keeps the form with the reason when the edit cannot be saved', async () => {
    vi.mocked(updateContext.updateAssetNote).mockRejectedValue(new Error('No write access.'));
    const user = userEvent.setup();

    renderItem();
    await user.click(screen.getByRole('button', { name: 'Edit Seal inspection' }));

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No write access.');
    expect(screen.getByLabelText(/Title/)).toHaveValue('Seal inspection');
  });

  it('drops a failed edit when it is cancelled', async () => {
    vi.mocked(updateContext.updateAssetNote).mockRejectedValue(new Error('No write access.'));
    const user = userEvent.setup();

    renderItem();
    await user.click(screen.getByRole('button', { name: 'Edit Seal inspection' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByRole('alert');

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.click(screen.getByRole('button', { name: 'Edit Seal inspection' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('asks before deleting, then hands the note to its list', async () => {
    const user = userEvent.setup();
    const note = makeAssetNote();

    renderItem({ note });
    await user.click(screen.getByRole('button', { name: 'Delete Seal inspection' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete note?' });

    expect(dialog).toHaveTextContent(
      'Seal inspection will be deleted permanently. This cannot be undone.',
    );
    expect(onDelete).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole('button', { name: 'Delete note' }));

    expect(onDelete).toHaveBeenCalledExactlyOnceWith(note);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('keeps the note when the delete is cancelled', async () => {
    const user = userEvent.setup();

    renderItem();
    await user.click(screen.getByRole('button', { name: 'Delete Seal inspection' }));

    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));

    expect(onDelete).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
