import { render, screen } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  UseAddAssetNoteContext,
  type UseAddAssetNoteContextType,
} from '../../../hooks/notes/useAddAssetNote';
import {
  UseAssetNotesContext,
  type UseAssetNotesContextType,
} from '../../../hooks/notes/useAssetNotes';
import { makeMockClient } from '../../../mocks/cogniteClient';
import { makeAssetNote } from '../../../mocks/notes';
import { makeQueryClientWrapper } from '../../../mocks/queryClientWrapper';
import { AssetNotes } from '../AssetNotes';

describe(AssetNotes.name, () => {
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    const client = makeMockClient();
    const listContext: UseAssetNotesContextType = {
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

  it('shows the add form above the notes of the asset', async () => {
    render(
      <AssetNotes
        assetIdentifier={{ space: 'asset-space', externalId: 'FLOC-1' }}
      />,
      { wrapper },
    );

    expect(
      screen.getByRole('button', { name: 'Add note' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Seal inspection')).toBeInTheDocument();
  });
});
