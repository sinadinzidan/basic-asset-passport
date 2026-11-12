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
import { AssetContext } from '../../../../hooks/assets/useAssetContext';
import { makeMockClient } from '../../../../mocks/cogniteClient';
import { makeLimitedList } from '../../../../mocks/lists';
import { makeAssetNote } from '../../../../mocks/notes';
import { makeQueryClientWrapper } from '../../../../mocks/QueryClientWrapper';
import { AssetNotes } from '../AssetNotes';

describe(AssetNotes.name, () => {
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    const client = makeMockClient();
    const listContext: UseAssetNotesContextType = {
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
    );
  });

  it('shows the add button above the notes of the asset', async () => {
    render(<AssetNotes assetIdentifier={{ space: 'asset-space', externalId: 'FLOC-1' }} />, {
      wrapper,
    });

    expect(screen.getByRole('button', { name: 'Add note' })).toBeInTheDocument();
    expect(await screen.findByText('Seal inspection')).toBeInTheDocument();
  });
});
