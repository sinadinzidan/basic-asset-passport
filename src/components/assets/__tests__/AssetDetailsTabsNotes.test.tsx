import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AssetEquipmentTab } from '../../../enums/assetEquipmentTab';
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
import { makeInstanceDetails } from '../../../mocks/assets';
import { makeMockClient } from '../../../mocks/cogniteClient';
import { makeAssetNote } from '../../../mocks/notes';
import { makeQueryClientWrapper } from '../../../mocks/queryClientWrapper';
import { AssetDetailsTabs } from '../AssetDetailsTabs';

const details = {
  asset: makeInstanceDetails({ space: 'asset-space', externalId: 'FLOC-7' }),
  equipment: [],
};

describe(`${AssetDetailsTabs.name} notes`, () => {
  let listContext: UseAssetNotesContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    const client = makeMockClient();
    listContext = {
      useAssetDataClient: vi.fn(() => client),
      listAssetNotes: vi.fn(() => Promise.resolve([makeAssetNote()])),
    };
    const addContext: UseAddAssetNoteContextType = {
      useAssetDataClient: vi.fn(() => client),
      createAssetNote: vi.fn(() => Promise.resolve()),
    };
    const updateContext: UseUpdateAssetNoteContextType = {
      useAssetDataClient: vi.fn(() => client),
      updateAssetNote: vi.fn(() => Promise.resolve()),
    };
    const deleteContext: UseDeleteAssetNoteContextType = {
      useAssetDataClient: vi.fn(() => client),
      deleteAssetNote: vi.fn(() => Promise.resolve()),
    };
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <UseAssetNotesContext.Provider value={listContext}>
        <UseAddAssetNoteContext.Provider value={addContext}>
          <UseUpdateAssetNoteContext.Provider value={updateContext}>
            <UseDeleteAssetNoteContext.Provider value={deleteContext}>
              <QueryWrapper>{children}</QueryWrapper>
            </UseDeleteAssetNoteContext.Provider>
          </UseUpdateAssetNoteContext.Provider>
        </UseAddAssetNoteContext.Provider>
      </UseAssetNotesContext.Provider>
    );
  });

  it('lists the notes of the open asset on the notes tab', async () => {
    render(
      <AssetDetailsTabs
        details={details}
        activeTab={AssetEquipmentTab.NOTES}
        onTabChange={vi.fn()}
      />,
      { wrapper },
    );

    expect(await screen.findByText('Seal inspection')).toBeInTheDocument();
    expect(listContext.listAssetNotes).toHaveBeenCalledWith(expect.anything(), {
      space: 'asset-space',
      externalId: 'FLOC-7',
    });
  });

  it('reports the notes tab when it is selected', async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    render(
      <AssetDetailsTabs
        details={details}
        activeTab={AssetEquipmentTab.PROPERTIES}
        onTabChange={onTabChange}
      />,
      { wrapper },
    );

    await user.click(screen.getByRole('tab', { name: 'Notes' }));

    expect(onTabChange).toHaveBeenCalledWith(AssetEquipmentTab.NOTES);
  });
});
