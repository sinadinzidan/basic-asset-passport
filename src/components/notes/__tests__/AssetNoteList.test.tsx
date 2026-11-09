import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  UseAssetNotesContext,
  type UseAssetNotesContextType,
} from '../../../hooks/notes/useAssetNotes';
import { makeMockClient } from '../../../mocks/cogniteClient';
import { makeAssetNote } from '../../../mocks/notes';
import { makeQueryClientWrapper } from '../../../mocks/queryClientWrapper';
import { AssetNoteList } from '../AssetNoteList';

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };

describe(AssetNoteList.name, () => {
  let mockContext: UseAssetNotesContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    mockContext = {
      useAssetDataClient: vi.fn(() => makeMockClient()),
      listAssetNotes: vi.fn(() => Promise.resolve([makeAssetNote()])),
    };
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <UseAssetNotesContext.Provider value={mockContext}>
        <QueryWrapper>{children}</QueryWrapper>
      </UseAssetNotesContext.Provider>
    );
  });

  function renderList() {
    return render(<AssetNoteList assetIdentifier={assetIdentifier} />, {
      wrapper,
    });
  }

  it('shows a loading status while the notes load', () => {
    vi.mocked(mockContext.listAssetNotes).mockReturnValue(
      new Promise(() => {}),
    );

    renderList();

    expect(screen.getByRole('status')).toHaveTextContent('Loading notes...');
  });

  it('lists each note with its text, author and date', async () => {
    renderList();

    expect(await screen.findByText('Seal inspection')).toBeInTheDocument();
    expect(
      screen.getByText('Mechanical seal checked, no leaks.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Sam Operator · 5 Nov 2026')).toBeInTheDocument();
  });

  it('shows an unknown author when the note has none', async () => {
    vi.mocked(mockContext.listAssetNotes).mockResolvedValue([
      makeAssetNote({ author: null, body: null }),
    ]);

    renderList();

    expect(
      await screen.findByText('Unknown author · 5 Nov 2026'),
    ).toBeInTheDocument();
  });

  it('shows an empty state when the asset has no notes', async () => {
    vi.mocked(mockContext.listAssetNotes).mockResolvedValue([]);

    renderList();

    expect(await screen.findByText('No notes yet')).toBeInTheDocument();
  });

  it('shows a readable error and retries the load', async () => {
    const user = userEvent.setup();
    vi.mocked(mockContext.listAssetNotes).mockRejectedValueOnce(
      new Error('failed'),
    );

    renderList();

    expect(
      await screen.findByText('Notes could not be loaded'),
    ).toBeInTheDocument();
    expect(screen.queryByText('No notes yet')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Seal inspection')).toBeInTheDocument();
    expect(mockContext.listAssetNotes).toHaveBeenCalledTimes(2);
  });
});
