import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NOTE_QUERY_LIMIT } from '../../../../constants/notes';
import {
  UseAssetNotesContext,
  type UseAssetNotesContextType,
} from '../../../../hooks/assets/notes/useAssetNotes';
import {
  UseDeleteAssetNoteContext,
  type UseDeleteAssetNoteContextType,
} from '../../../../hooks/assets/notes/useDeleteAssetNote';
import {
  UseUpdateAssetNoteContext,
  type UseUpdateAssetNoteContextType,
} from '../../../../hooks/assets/notes/useUpdateAssetNote';
import { AssetContext } from '../../../../hooks/assets/useAssetContext';
import { makeMockClient } from '../../../../mocks/cogniteClient';
import { makeLimitedList } from '../../../../mocks/lists';
import { makeAssetNote } from '../../../../mocks/notes';
import { makeQueryClientWrapper } from '../../../../mocks/QueryClientWrapper';
import { AssetNoteList } from '../AssetNoteList';

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };

describe(AssetNoteList.name, () => {
  const client = makeMockClient();
  let mockContext: UseAssetNotesContextType;
  let updateContext: UseUpdateAssetNoteContextType;
  let deleteContext: UseDeleteAssetNoteContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    mockContext = {
      listAssetNotes: vi.fn(() => Promise.resolve(makeLimitedList([makeAssetNote()]))),
    };
    updateContext = {
      updateAssetNote: vi.fn(() => Promise.resolve()),
    };
    deleteContext = {
      deleteAssetNote: vi.fn(() => Promise.resolve()),
    };
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <UseAssetNotesContext.Provider value={mockContext}>
        <UseUpdateAssetNoteContext.Provider value={updateContext}>
          <UseDeleteAssetNoteContext.Provider value={deleteContext}>
            <QueryWrapper>
              <AssetContext.Provider value={client}>{children}</AssetContext.Provider>
            </QueryWrapper>
          </UseDeleteAssetNoteContext.Provider>
        </UseUpdateAssetNoteContext.Provider>
      </UseAssetNotesContext.Provider>
    );
  });

  function renderList() {
    return render(<AssetNoteList assetIdentifier={assetIdentifier} />, {
      wrapper,
    });
  }

  it('shows a loading status while the notes load', () => {
    vi.mocked(mockContext.listAssetNotes).mockReturnValue(new Promise(() => {}));

    renderList();

    expect(screen.getByRole('status')).toHaveTextContent('Loading notes...');
  });

  it('lists each note with its text, author and date', async () => {
    renderList();

    expect(await screen.findByText('Seal inspection')).toBeInTheDocument();
    expect(screen.getByText('Mechanical seal checked, no leaks.')).toBeInTheDocument();
    expect(screen.getByText('Sam Operator · 5 Nov 2026')).toBeInTheDocument();
  });

  it('shows an unknown author when the note has none', async () => {
    vi.mocked(mockContext.listAssetNotes).mockResolvedValue(
      makeLimitedList([makeAssetNote({ author: null, body: null })]),
    );

    renderList();

    expect(await screen.findByText('Unknown author · 5 Nov 2026')).toBeInTheDocument();
  });

  it('shows an empty state when the asset has no notes', async () => {
    vi.mocked(mockContext.listAssetNotes).mockResolvedValue(makeLimitedList());

    renderList();

    expect(await screen.findByText('No notes yet')).toBeInTheDocument();
  });

  it('offers no more notes when all of them are shown', async () => {
    renderList();

    expect(await screen.findByText('Seal inspection')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show more notes' })).not.toBeInTheDocument();
  });

  it('reads a longer list when more notes are asked for', async () => {
    // Arrange
    const user = userEvent.setup();
    vi.mocked(mockContext.listAssetNotes)
      .mockResolvedValueOnce(makeLimitedList([makeAssetNote()], true))
      .mockResolvedValueOnce(
        makeLimitedList([
          makeAssetNote(),
          makeAssetNote({ externalId: 'note-2', title: 'Bearing check' }),
        ]),
      );
    renderList();

    // Act
    await user.click(await screen.findByRole('button', { name: 'Show more notes' }));

    // Assert
    expect(await screen.findByText('Bearing check')).toBeInTheDocument();
    expect(mockContext.listAssetNotes).toHaveBeenLastCalledWith(
      client,
      assetIdentifier,
      NOTE_QUERY_LIMIT * 2,
    );
    expect(screen.queryByRole('button', { name: 'Show more notes' })).not.toBeInTheDocument();
  });

  it('shows a readable error and retries the load', async () => {
    const user = userEvent.setup();
    vi.mocked(mockContext.listAssetNotes).mockRejectedValueOnce(new Error('failed'));

    renderList();

    expect(await screen.findByText('Notes could not be loaded')).toBeInTheDocument();
    expect(screen.getByText('Reason: failed')).toBeInTheDocument();
    expect(screen.queryByText('No notes yet')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Seal inspection')).toBeInTheDocument();
    expect(mockContext.listAssetNotes).toHaveBeenCalledTimes(2);
  });

  describe('deleting a note', () => {
    async function openDeleteDialog(user: ReturnType<typeof userEvent.setup>) {
      renderList();
      await user.click(await screen.findByRole('button', { name: 'Delete Seal inspection' }));
      return screen.getByRole('dialog');
    }

    it('asks before deleting and names the note', async () => {
      const user = userEvent.setup();

      const dialog = await openDeleteDialog(user);

      expect(within(dialog).getByText('Delete note?')).toBeVisible();
      expect(within(dialog).getByText(/Seal inspection will be deleted permanently/)).toBeVisible();
      expect(deleteContext.deleteAssetNote).not.toHaveBeenCalled();
    });

    it('keeps the note when the delete is cancelled', async () => {
      const user = userEvent.setup();
      const dialog = await openDeleteDialog(user);

      await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

      expect(deleteContext.deleteAssetNote).not.toHaveBeenCalled();
      expect(screen.getByText('Seal inspection')).toBeInTheDocument();
    });

    it('deletes the note and reloads the list when confirmed', async () => {
      const user = userEvent.setup();
      const dialog = await openDeleteDialog(user);

      await user.click(within(dialog).getByRole('button', { name: 'Delete note' }));

      expect(deleteContext.deleteAssetNote).toHaveBeenCalledWith(client, {
        space: 'sp-asset-passport-data',
        externalId: 'note-1',
      });
      await vi.waitFor(() => expect(mockContext.listAssetNotes).toHaveBeenCalledTimes(2));
    });

    it('keeps the dialog open and locked until the delete is over', async () => {
      const user = userEvent.setup();
      let finishDelete: () => void = () => {};
      vi.mocked(deleteContext.deleteAssetNote).mockReturnValue(
        new Promise<void>((resolve) => {
          finishDelete = resolve;
        }),
      );
      const dialog = await openDeleteDialog(user);

      await user.click(within(dialog).getByRole('button', { name: 'Delete note' }));

      expect(screen.getByRole('dialog')).toBeVisible();
      expect(within(dialog).getByRole('button', { name: 'Deleting...' })).toBeDisabled();
      expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDisabled();

      finishDelete();

      await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it('closes the dialog and shows the reason when the delete fails', async () => {
      const user = userEvent.setup();
      vi.mocked(deleteContext.deleteAssetNote).mockRejectedValue(new Error('Forbidden'));
      const dialog = await openDeleteDialog(user);

      await user.click(within(dialog).getByRole('button', { name: 'Delete note' }));

      await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(screen.getByText('Forbidden')).toBeVisible();
    });

    it('shows why a note could not be deleted and keeps it', async () => {
      const user = userEvent.setup();
      vi.mocked(deleteContext.deleteAssetNote).mockRejectedValue(new Error('Forbidden'));
      const dialog = await openDeleteDialog(user);

      await user.click(within(dialog).getByRole('button', { name: 'Delete note' }));

      expect(await screen.findByText('The note could not be deleted')).toBeVisible();
      expect(screen.getByText('Forbidden')).toBeVisible();
      expect(screen.getByText('Seal inspection')).toBeInTheDocument();
    });
  });

  describe('editing a note', () => {
    async function openEditor(user: ReturnType<typeof userEvent.setup>) {
      renderList();
      await user.click(await screen.findByRole('button', { name: 'Edit Seal inspection' }));
    }

    it('opens the note in a form that holds its title and text', async () => {
      const user = userEvent.setup();

      await openEditor(user);

      expect(screen.getByRole('textbox', { name: /Title/ })).toHaveValue('Seal inspection');
      expect(screen.getByRole('textbox', { name: 'Note' })).toHaveValue(
        'Mechanical seal checked, no leaks.',
      );
    });

    it('saves the changes and goes back to the note', async () => {
      const user = userEvent.setup();
      await openEditor(user);

      const title = screen.getByRole('textbox', { name: /Title/ });
      await user.clear(title);
      await user.type(title, 'Seal replaced');
      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(updateContext.updateAssetNote).toHaveBeenCalledWith(
        client,
        { space: 'sp-asset-passport-data', externalId: 'note-1' },
        { title: 'Seal replaced', body: 'Mechanical seal checked, no leaks.' },
      );
      await vi.waitFor(() =>
        expect(screen.queryByRole('textbox', { name: /Title/ })).not.toBeInTheDocument(),
      );
      await vi.waitFor(() => expect(mockContext.listAssetNotes).toHaveBeenCalledTimes(2));
    });

    it('closes the form of each note when two are saved at once', async () => {
      const user = userEvent.setup();
      let finishFirstSave: () => void = () => {};
      vi.mocked(mockContext.listAssetNotes).mockResolvedValue(
        makeLimitedList([
          makeAssetNote(),
          makeAssetNote({ externalId: 'note-2', title: 'Bearing check' }),
        ]),
      );
      vi.mocked(updateContext.updateAssetNote).mockReturnValueOnce(
        new Promise<void>((resolve) => {
          finishFirstSave = resolve;
        }),
      );
      await openEditor(user);
      await user.click(screen.getByRole('button', { name: 'Save' }));
      await user.click(screen.getByRole('button', { name: 'Edit Bearing check' }));

      await user.click(screen.getByRole('button', { name: 'Save' }));
      finishFirstSave();

      await vi.waitFor(() =>
        expect(screen.queryByRole('textbox', { name: /Title/ })).not.toBeInTheDocument(),
      );
    });

    it('keeps a save that failed on show when another note is cancelled', async () => {
      const user = userEvent.setup();
      vi.mocked(mockContext.listAssetNotes).mockResolvedValue(
        makeLimitedList([
          makeAssetNote(),
          makeAssetNote({ externalId: 'note-2', title: 'Bearing check' }),
        ]),
      );
      vi.mocked(updateContext.updateAssetNote).mockRejectedValue(new Error('Forbidden'));
      await openEditor(user);
      await user.click(screen.getByRole('button', { name: 'Save' }));
      expect(await screen.findByText('Forbidden')).toBeVisible();
      await user.click(screen.getByRole('button', { name: 'Edit Bearing check' }));

      await user.click(screen.getAllByRole('button', { name: 'Cancel' })[1]);

      expect(screen.getByText('Forbidden')).toBeVisible();
    });

    it('leaves the note as it was when editing is cancelled', async () => {
      const user = userEvent.setup();
      await openEditor(user);
      await user.type(screen.getByRole('textbox', { name: /Title/ }), ' more');

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(updateContext.updateAssetNote).not.toHaveBeenCalled();
      expect(screen.getByText('Seal inspection')).toBeInTheDocument();
    });

    it('cannot save a note without a title', async () => {
      const user = userEvent.setup();
      await openEditor(user);

      await user.clear(screen.getByRole('textbox', { name: /Title/ }));

      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    });

    it('shows why a note could not be saved and keeps what was typed', async () => {
      const user = userEvent.setup();
      vi.mocked(updateContext.updateAssetNote).mockRejectedValue(new Error('Forbidden'));
      await openEditor(user);
      await user.type(screen.getByRole('textbox', { name: /Title/ }), ' again');

      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(await screen.findByText('The note could not be saved')).toBeVisible();
      expect(screen.getByText('Forbidden')).toBeVisible();
      expect(screen.getByRole('textbox', { name: /Title/ })).toHaveValue('Seal inspection again');
    });
  });
});
