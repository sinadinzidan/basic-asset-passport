import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StoreApi } from 'zustand';

import { NO_TAB_COUNTS } from '../../../__mocks__/assetDetailsTabCounts';
import { makeInstanceDetails } from '../../../__mocks__/assets';
import { makeMockClient } from '../../../__mocks__/cogniteClient';
import { makeLimitedList } from '../../../__mocks__/lists';
import { makeNavigationStore } from '../../../__mocks__/navigation';
import { makeAssetNote } from '../../../__mocks__/notes';
import { makeQueryClientWrapper } from '../../../__mocks__/QueryClientWrapper';
import { NOTE_QUERY_LIMIT } from '../../../constants/notes';
import { AssetTab } from '../../../enums/assetTab';
import { UseAddAssetNoteContext } from '../../../hooks/assets/notes/useAddAssetNote';
import { UseAssetNoteItemViewModelContext } from '../../../hooks/assets/notes/useAssetNoteItemViewModel';
import { UseAssetNotesContext } from '../../../hooks/assets/notes/useAssetNotes';
import { UseDeleteAssetNoteContext } from '../../../hooks/assets/notes/useDeleteAssetNote';
import { AssetContext } from '../../../hooks/assets/useAssetContext';
import { NavigationStoreContext } from '../../../hooks/general/useNavigationState';
import type { AssetNoteService } from '../../../services/assets/notes/assetNote';
import type { NavigationStore } from '../../../types/navigation';
import { AssetDetailsTabs } from '../AssetDetailsTabs';

const asset = makeInstanceDetails({
  space: 'asset-space',
  externalId: 'FLOC-7',
});

describe(`${AssetDetailsTabs.name} notes`, () => {
  let listContext: Pick<AssetNoteService, 'listAssetNotes'>;
  let wrapper: ComponentType<{ children: ReactNode }>;
  let store: StoreApi<NavigationStore>;

  beforeEach(() => {
    store = makeNavigationStore({
      selectedAsset: { space: asset.space, externalId: asset.externalId },
    });
    const client = makeMockClient();

    listContext = {
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
      <NavigationStoreContext.Provider value={store}>
        <UseAssetNotesContext.Provider value={{ createAssetNoteService: () => listContext }}>
          <UseAddAssetNoteContext.Provider value={{ createAssetNoteService: () => addContext }}>
            <UseAssetNoteItemViewModelContext.Provider
              value={{ createAssetNoteService: () => updateContext }}
            >
              <UseDeleteAssetNoteContext.Provider
                value={{ createAssetNoteService: () => deleteContext }}
              >
                <QueryWrapper>
                  <AssetContext.Provider value={client}>{children}</AssetContext.Provider>
                </QueryWrapper>
              </UseDeleteAssetNoteContext.Provider>
            </UseAssetNoteItemViewModelContext.Provider>
          </UseAddAssetNoteContext.Provider>
        </UseAssetNotesContext.Provider>
      </NavigationStoreContext.Provider>
    );
  });

  it('keeps the notes tab open to read while its notes are still being counted', async () => {
    store = makeNavigationStore({
      selectedAsset: { space: asset.space, externalId: asset.externalId },
      activeAssetTab: AssetTab.NOTES,
    });
    render(
      <AssetDetailsTabs
        asset={asset}
        tabCounts={{
          ...NO_TAB_COUNTS,
          notes: { count: null, isLoading: true },
        }}
      />,
      { wrapper },
    );

    expect(await screen.findByText('Seal inspection')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Notes' })).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('lists the notes of the open asset on the notes tab', async () => {
    store = makeNavigationStore({
      selectedAsset: { space: asset.space, externalId: asset.externalId },
      activeAssetTab: AssetTab.NOTES,
    });
    render(<AssetDetailsTabs asset={asset} tabCounts={NO_TAB_COUNTS} />, { wrapper });

    expect(await screen.findByText('Seal inspection')).toBeInTheDocument();
    expect(listContext.listAssetNotes).toHaveBeenCalledWith(
      { space: 'asset-space', externalId: 'FLOC-7' },
      NOTE_QUERY_LIMIT,
    );
  });

  it('switches to the notes tab when it is chosen', async () => {
    const user = userEvent.setup();

    render(<AssetDetailsTabs asset={asset} tabCounts={NO_TAB_COUNTS} />, { wrapper });

    await user.click(screen.getByRole('tab', { name: 'Notes' }));

    expect(store.getState().navigationState.activeAssetTab).toBe(AssetTab.NOTES);
    expect(await screen.findByText('Seal inspection')).toBeInTheDocument();
  });
});
