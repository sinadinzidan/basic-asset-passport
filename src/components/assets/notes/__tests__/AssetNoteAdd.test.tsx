import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeMockClient } from '../../../../__mocks__/cogniteClient';
import { makeNavigationStore } from '../../../../__mocks__/navigation';
import { makeQueryClientWrapper } from '../../../../__mocks__/QueryClientWrapper';
import { UseAddAssetNoteContext } from '../../../../hooks/assets/notes/useAddAssetNote';
import { AssetContext } from '../../../../hooks/assets/useAssetContext';
import { NavigationStoreContext } from '../../../../hooks/general/useNavigationState';
import type { AssetNoteService } from '../../../../services/assets/notes/assetNote';
import { AssetNoteAdd } from '../AssetNoteAdd';

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };

const navigationStore = makeNavigationStore({ selectedAsset: assetIdentifier });
const client = makeMockClient();

describe(AssetNoteAdd.name, () => {
  let mockContext: Pick<AssetNoteService, 'createAssetNote'>;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    mockContext = {
      createAssetNote: vi.fn(() => Promise.resolve()),
    };
    const QueryWrapper = makeQueryClientWrapper();

    wrapper = ({ children }) => (
      <UseAddAssetNoteContext.Provider value={{ createAssetNoteService: () => mockContext }}>
        <QueryWrapper>
          <AssetContext.Provider value={client}>
            <NavigationStoreContext.Provider value={navigationStore}>
              {children}
            </NavigationStoreContext.Provider>
          </AssetContext.Provider>
        </QueryWrapper>
      </UseAddAssetNoteContext.Provider>
    );
  });

  async function openDialog() {
    const user = userEvent.setup();

    render(<AssetNoteAdd />, { wrapper });
    await user.click(screen.getByRole('button', { name: 'Add note' }));

    return user;
  }

  it('shows only the add button until it is clicked', () => {
    render(<AssetNoteAdd />, { wrapper });

    expect(screen.getByRole('button', { name: 'Add note' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens a dialog with the title and text fields', async () => {
    await openDialog();

    expect(await screen.findByRole('dialog', { name: 'Add note' })).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Note')).toBeInTheDocument();
  });

  it('disables saving until the note has a title', async () => {
    const user = await openDialog();

    const save = await screen.findByRole('button', { name: 'Save note' });

    expect(save).toBeDisabled();

    await user.type(screen.getByLabelText('Title'), 'Inspection');

    expect(save).toBeEnabled();
  });

  it('saves the note for the asset and closes the dialog', async () => {
    const user = await openDialog();

    await user.type(await screen.findByLabelText('Title'), '  Inspection ');
    await user.type(screen.getByLabelText('Note'), 'All good');
    await user.click(screen.getByRole('button', { name: 'Save note' }));

    expect(mockContext.createAssetNote).toHaveBeenCalledWith(assetIdentifier, {
      title: '  Inspection ',
      body: 'All good',
    });
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('starts empty the next time the dialog opens', async () => {
    const user = await openDialog();

    await user.type(await screen.findByLabelText('Title'), 'Inspection');
    await user.click(screen.getByRole('button', { name: 'Save note' }));
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Add note' }));

    expect(await screen.findByLabelText('Title')).toHaveValue('');
  });

  it('disables saving while the note is saving', async () => {
    vi.mocked(mockContext.createAssetNote).mockReturnValue(new Promise(() => {}));
    const user = await openDialog();

    await user.type(await screen.findByLabelText('Title'), 'Inspection');
    await user.click(screen.getByRole('button', { name: 'Save note' }));

    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
  });

  it('shows why the save failed, keeps what was typed and stays open', async () => {
    vi.mocked(mockContext.createAssetNote).mockRejectedValue(new Error('Forbidden'));
    const user = await openDialog();

    await user.type(await screen.findByLabelText('Title'), 'Inspection');
    await user.click(screen.getByRole('button', { name: 'Save note' }));

    expect(await screen.findByText('The note could not be saved')).toBeInTheDocument();
    expect(screen.getByText('Forbidden')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveValue('Inspection');
  });

  it('drops what was typed when the dialog is cancelled', async () => {
    const user = await openDialog();

    await user.type(await screen.findByLabelText('Title'), 'Inspection');

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.click(screen.getByRole('button', { name: 'Add note' }));

    expect(await screen.findByLabelText('Title')).toHaveValue('');
    expect(mockContext.createAssetNote).not.toHaveBeenCalled();
  });
});
