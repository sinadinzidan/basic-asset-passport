import { render, screen } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  UseAddAssetNoteContext,
  type UseAddAssetNoteContextType,
} from '../../../../hooks/assets/notes/useAddAssetNote';
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
import { makeMockClient } from '../../../../mocks/cogniteClient';
import { makeAssetNote } from '../../../../mocks/notes';
import { makeQueryClientWrapper } from '../../../../mocks/queryClientWrapper';
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

  it('shows the add button above the notes of the asset', async () => {
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
