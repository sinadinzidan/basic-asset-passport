import { act, renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeMockClient } from '../../../../__mocks__/cogniteClient';
import { makeAssetNote } from '../../../../__mocks__/notes';
import { makeQueryClientWrapper } from '../../../../__mocks__/QueryClientWrapper';
import type { AssetNoteService } from '../../../../services/assets/notes/assetNote';
import { AssetContext } from '../../useAssetContext';
import { useAssetNoteItemViewModel } from '../useAssetNoteItemViewModel';
import { UseUpdateAssetNoteContext } from '../useUpdateAssetNote';

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };
const edit = { title: 'Bearing check', body: 'Runs warm.' };

describe(useAssetNoteItemViewModel.name, () => {
  const client = makeMockClient();
  let noteService: Pick<AssetNoteService, 'updateAssetNote'>;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    noteService = { updateAssetNote: vi.fn(() => Promise.resolve()) };
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <UseUpdateAssetNoteContext.Provider value={{ createAssetNoteService: () => noteService }}>
        <QueryWrapper>
          <AssetContext.Provider value={client}>{children}</AssetContext.Provider>
        </QueryWrapper>
      </UseUpdateAssetNoteContext.Provider>
    );
  });

  function renderViewModel() {
    return renderHook(() => useAssetNoteItemViewModel(assetIdentifier, makeAssetNote()), {
      wrapper,
    });
  }

  it('starts with nothing saving and no error', () => {
    const { result } = renderViewModel();

    expect(result.current.isSaving).toBe(false);
    expect(result.current.saveErrorMessage).toBeNull();
  });

  it('is saving while the edit is written', async () => {
    vi.mocked(noteService.updateAssetNote).mockReturnValue(new Promise(() => {}));
    const { result } = renderViewModel();

    act(() => result.current.save(edit, vi.fn()));

    await waitFor(() => expect(result.current.isSaving).toBe(true));
  });

  it('writes the edit to that note by its identity, then says it is saved', async () => {
    const onSaved = vi.fn();
    const { result } = renderViewModel();

    act(() => result.current.save(edit, onSaved));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(noteService.updateAssetNote).toHaveBeenCalledWith(
      { space: 'sp-asset-passport-data', externalId: 'note-1' },
      edit,
    );
  });

  it('keeps why the edit could not be saved, and drops it when asked', async () => {
    vi.mocked(noteService.updateAssetNote).mockRejectedValue(new Error('No write access.'));
    const onSaved = vi.fn();
    const { result } = renderViewModel();
    act(() => result.current.save(edit, onSaved));
    await waitFor(() => expect(result.current.saveErrorMessage).toBe('No write access.'));
    expect(onSaved).not.toHaveBeenCalled();

    act(() => result.current.discardSaveError());

    await waitFor(() => expect(result.current.saveErrorMessage).toBeNull());
  });
});
