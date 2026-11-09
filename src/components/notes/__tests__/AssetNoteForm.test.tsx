import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  UseAddAssetNoteContext,
  type UseAddAssetNoteContextType,
} from '../../../hooks/notes/useAddAssetNote';
import { makeMockClient } from '../../../mocks/cogniteClient';
import { makeQueryClientWrapper } from '../../../mocks/queryClientWrapper';
import { AssetNoteForm } from '../AssetNoteForm';

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };
const client = makeMockClient();

describe(AssetNoteForm.name, () => {
  let mockContext: UseAddAssetNoteContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    mockContext = {
      useAssetDataClient: vi.fn(() => client),
      createAssetNote: vi.fn(() => Promise.resolve()),
    };
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <UseAddAssetNoteContext.Provider value={mockContext}>
        <QueryWrapper>{children}</QueryWrapper>
      </UseAddAssetNoteContext.Provider>
    );
  });

  function renderForm() {
    return render(<AssetNoteForm assetIdentifier={assetIdentifier} />, {
      wrapper,
    });
  }

  it('disables the button until the note has a title', async () => {
    const user = userEvent.setup();
    renderForm();

    const button = screen.getByRole('button', { name: 'Add note' });
    expect(button).toBeDisabled();

    await user.type(screen.getByLabelText('Title'), 'Inspection');

    expect(button).toBeEnabled();
  });

  it('saves the note for the asset and clears the form', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('Title'), '  Inspection ');
    await user.type(screen.getByLabelText('Note'), 'All good');
    await user.click(screen.getByRole('button', { name: 'Add note' }));

    expect(mockContext.createAssetNote).toHaveBeenCalledWith(
      client,
      assetIdentifier,
      { title: '  Inspection ', body: 'All good' },
    );
    await vi.waitFor(() => expect(screen.getByLabelText('Title')).toHaveValue(''));
    expect(screen.getByLabelText('Note')).toHaveValue('');
  });

  it('disables the button while the note is saving', async () => {
    const user = userEvent.setup();
    vi.mocked(mockContext.createAssetNote).mockReturnValue(
      new Promise(() => {}),
    );
    renderForm();

    await user.type(screen.getByLabelText('Title'), 'Inspection');
    await user.click(screen.getByRole('button', { name: 'Add note' }));

    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
  });

  it('shows why the save failed and keeps what was typed', async () => {
    const user = userEvent.setup();
    vi.mocked(mockContext.createAssetNote).mockRejectedValue(
      new Error('Forbidden'),
    );
    renderForm();

    await user.type(screen.getByLabelText('Title'), 'Inspection');
    await user.click(screen.getByRole('button', { name: 'Add note' }));

    expect(
      await screen.findByText('The note could not be saved'),
    ).toBeInTheDocument();
    expect(screen.getByText('Forbidden')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveValue('Inspection');
  });
});
