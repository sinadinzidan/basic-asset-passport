import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AssetEquipmentTab } from '../../../enums/assetEquipmentTab';
import {
  UseAddAssetNoteContext,
  type UseAddAssetNoteContextType,
} from '../../../hooks/notes/useAddAssetNote';
import {
  UseAssetNotesContext,
  type UseAssetNotesContextType,
} from '../../../hooks/notes/useAssetNotes';
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
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <UseAssetNotesContext.Provider value={listContext}>
        <UseAddAssetNoteContext.Provider value={addContext}>
          <QueryWrapper>{children}</QueryWrapper>
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
    expect(listContext.listAssetNotes).toHaveBeenCalledWith(
      expect.anything(),
      { space: 'asset-space', externalId: 'FLOC-7' },
    );
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
