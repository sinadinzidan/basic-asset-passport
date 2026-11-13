import { render, screen } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeMockClient } from '../../../../__mocks__/cogniteClient';
import { makeLimitedList } from '../../../../__mocks__/lists';
import { makeNavigationStore } from '../../../../__mocks__/navigation';
import { makeAssetNote } from '../../../../__mocks__/notes';
import { makeQueryClientWrapper } from '../../../../__mocks__/QueryClientWrapper';
import { UseAddAssetNoteContext } from '../../../../hooks/assets/notes/useAddAssetNote';
import { UseAssetNotesContext } from '../../../../hooks/assets/notes/useAssetNotes';
import { UseDeleteAssetNoteContext } from '../../../../hooks/assets/notes/useDeleteAssetNote';
import { UseAssetNoteItemViewModelContext } from '../../../../hooks/assets/notes/view-models/useAssetNoteItemViewModel';
import { AssetClientContext } from '../../../../hooks/assets/useAssetClient';
import { NavigationStoreContext } from '../../../../hooks/general/useNavigationState';
import type { AssetNoteService } from '../../../../services/assets/notes/assetNote';
import { AssetNotes } from '../AssetNotes';

const navigationStore = makeNavigationStore({
  selectedAsset: { space: 'asset-space', externalId: 'FLOC-1' },
});

describe(AssetNotes.name, () => {
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    const client = makeMockClient();
    const listContext: Pick<AssetNoteService, 'listAssetNotes'> = {
      listAssetNotes: vi.fn(() => Promise.resolve(makeLimitedList([makeAssetNote()]))),
    };
    const addContext: Pick<AssetNoteService, 'createAssetNote'> = {
      createAssetNote: vi.fn(() => Promise.resolve()),
    };
    const updateContext: Pick<AssetNoteService, 'updateAssetNote'> = {
      updateAssetNote: vi.fn(() => Promise.resolve()),
    };
    const deleteContext: Pick<AssetNoteService, 'deleteAssetNote'> = {
      deleteAssetNote: vi.fn(() => Promise.resolve()),
    };
    const QueryWrapper = makeQueryClientWrapper();

    wrapper = ({ children }) => (
      <UseAssetNotesContext.Provider value={{ createAssetNoteService: () => listContext }}>
        <UseAddAssetNoteContext.Provider value={{ createAssetNoteService: () => addContext }}>
          <UseAssetNoteItemViewModelContext.Provider
            value={{ createAssetNoteService: () => updateContext }}
          >
            <UseDeleteAssetNoteContext.Provider
              value={{ createAssetNoteService: () => deleteContext }}
            >
              <QueryWrapper>
                <AssetClientContext.Provider value={client}>
                  <NavigationStoreContext.Provider value={navigationStore}>
                    {children}
                  </NavigationStoreContext.Provider>
                </AssetClientContext.Provider>
              </QueryWrapper>
            </UseDeleteAssetNoteContext.Provider>
          </UseAssetNoteItemViewModelContext.Provider>
        </UseAddAssetNoteContext.Provider>
      </UseAssetNotesContext.Provider>
    );
  });

  it('shows the add button above the notes of the asset', async () => {
    render(<AssetNotes />, {
      wrapper,
    });

    expect(screen.getByRole('button', { name: 'Add note' })).toBeInTheDocument();
    expect(await screen.findByText('Seal inspection')).toBeInTheDocument();
  });
});
