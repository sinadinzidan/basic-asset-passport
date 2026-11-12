import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StoreApi } from 'zustand';

import { NOTE_QUERY_LIMIT } from '../../../constants/notes';
import { AssetTab } from '../../../enums/assetTab';
import {
  UseAddAssetNoteContext,
  type UseAddAssetNoteContextType,
} from '../../../hooks/assets/notes/useAddAssetNote';
import {
  UseAssetNotesContext,
  type UseAssetNotesContextType,
} from '../../../hooks/assets/notes/useAssetNotes';
import {
  UseDeleteAssetNoteContext,
  type UseDeleteAssetNoteContextType,
} from '../../../hooks/assets/notes/useDeleteAssetNote';
import {
  UseUpdateAssetNoteContext,
  type UseUpdateAssetNoteContextType,
} from '../../../hooks/assets/notes/useUpdateAssetNote';
import { AssetContext } from '../../../hooks/assets/useAssetContext';
import { NavigationStoreContext } from '../../../hooks/general/useNavigationState';
import { NO_TAB_COUNTS } from '../../../mocks/assetDetailsTabCounts';
import { makeInstanceDetails } from '../../../mocks/assets';
import { makeMockClient } from '../../../mocks/cogniteClient';
import { makeLimitedList } from '../../../mocks/lists';
import { makeNavigationStore } from '../../../mocks/navigation';
import { makeAssetNote } from '../../../mocks/notes';
import { makeQueryClientWrapper } from '../../../mocks/QueryClientWrapper';
import type { NavigationStore } from '../../../types/navigation';
import { AssetDetailsTabs } from '../AssetDetailsTabs';

const asset = makeInstanceDetails({
  space: 'asset-space',
  externalId: 'FLOC-7',
});

describe(`${AssetDetailsTabs.name} notes`, () => {
  let listContext: UseAssetNotesContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;
  let store: StoreApi<NavigationStore>;

  beforeEach(() => {
    store = makeNavigationStore();
    const client = makeMockClient();
    listContext = {
      listAssetNotes: vi.fn(() => Promise.resolve(makeLimitedList([makeAssetNote()]))),
    };
    const addContext: UseAddAssetNoteContextType = {
      createAssetNote: vi.fn(() => Promise.resolve()),
    };
    const updateContext: UseUpdateAssetNoteContextType = {
      updateAssetNote: vi.fn(() => Promise.resolve()),
    };
    const deleteContext: UseDeleteAssetNoteContextType = {
      deleteAssetNote: vi.fn(() => Promise.resolve()),
    };
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <NavigationStoreContext.Provider value={store}>
        <UseAssetNotesContext.Provider value={listContext}>
          <UseAddAssetNoteContext.Provider value={addContext}>
            <UseUpdateAssetNoteContext.Provider value={updateContext}>
              <UseDeleteAssetNoteContext.Provider value={deleteContext}>
                <QueryWrapper>
                  <AssetContext.Provider value={client}>{children}</AssetContext.Provider>
                </QueryWrapper>
              </UseDeleteAssetNoteContext.Provider>
            </UseUpdateAssetNoteContext.Provider>
          </UseAddAssetNoteContext.Provider>
        </UseAssetNotesContext.Provider>
      </NavigationStoreContext.Provider>
    );
  });

  it('keeps the notes tab open to read while its notes are still being counted', async () => {
    store = makeNavigationStore({ activeAssetTab: AssetTab.NOTES });
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
    store = makeNavigationStore({ activeAssetTab: AssetTab.NOTES });
    render(<AssetDetailsTabs asset={asset} tabCounts={NO_TAB_COUNTS} />, { wrapper });

    expect(await screen.findByText('Seal inspection')).toBeInTheDocument();
    expect(listContext.listAssetNotes).toHaveBeenCalledWith(
      expect.anything(),
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
