import { act, renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeMockClient } from '../../../../../__mocks__/cogniteClient';
import { makeLimitedList } from '../../../../../__mocks__/lists';
import { makeNavigationStore } from '../../../../../__mocks__/navigation';
import { makeAssetNote } from '../../../../../__mocks__/notes';
import { makeQueryClientWrapper } from '../../../../../__mocks__/QueryClientWrapper';
import { NOTE_QUERY_LIMIT } from '../../../../../constants/notes';
import type { AssetNoteService } from '../../../../../services/assets/notes/assetNote';
import { NavigationStoreContext } from '../../../../general/useNavigationState';
import { AssetClientContext } from '../../../useAssetClient';
import { UseAssetNotesContext } from '../../useAssetNotes';
import { UseDeleteAssetNoteContext } from '../../useDeleteAssetNote';
import { useAssetNoteListViewModel } from '../useAssetNoteListViewModel';

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };

const navigationStore = makeNavigationStore({ selectedAsset: assetIdentifier });

describe(useAssetNoteListViewModel.name, () => {
  const client = makeMockClient();
  let noteService: Pick<AssetNoteService, 'listAssetNotes'> &
    Pick<AssetNoteService, 'deleteAssetNote'>;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    noteService = {
      listAssetNotes: vi.fn(() => Promise.resolve(makeLimitedList([makeAssetNote()], true))),
      deleteAssetNote: vi.fn(() => Promise.resolve()),
    };
    const QueryWrapper = makeQueryClientWrapper();

    wrapper = ({ children }) => (
      <UseAssetNotesContext.Provider value={{ createAssetNoteService: () => noteService }}>
        <UseDeleteAssetNoteContext.Provider value={{ createAssetNoteService: () => noteService }}>
          <QueryWrapper>
            <AssetClientContext.Provider value={client}>
              <NavigationStoreContext.Provider value={navigationStore}>
                {children}
              </NavigationStoreContext.Provider>
            </AssetClientContext.Provider>
          </QueryWrapper>
        </UseDeleteAssetNoteContext.Provider>
      </UseAssetNotesContext.Provider>
    );
  });

  function renderViewModel() {
    return renderHook(() => useAssetNoteListViewModel(), { wrapper });
  }

  it('is pending with no notes until the list arrives', async () => {
    const { result } = renderViewModel();

    expect(result.current.isPending).toBe(true);
    expect(result.current.notes).toEqual([]);
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it('gives the notes of the asset and whether the asset has more', async () => {
    const { result } = renderViewModel();

    await waitFor(() => expect(result.current.notes).toEqual([makeAssetNote()]));
    expect(result.current.hasMore).toBe(true);
    expect(result.current.deleteErrorMessage).toBeNull();
  });

  it('reads a longer list when more notes are asked for', async () => {
    const { result } = renderViewModel();

    await waitFor(() => expect(result.current.hasMore).toBe(true));

    act(() => result.current.showMore());

    await waitFor(() =>
      expect(noteService.listAssetNotes).toHaveBeenLastCalledWith(
        assetIdentifier,
        NOTE_QUERY_LIMIT * 2,
      ),
    );
  });

  it('deletes a note by its identity only', async () => {
    const { result } = renderViewModel();

    await waitFor(() => expect(result.current.notes).toHaveLength(1));

    await act(() => result.current.deleteNote(makeAssetNote()));

    expect(noteService.deleteAssetNote).toHaveBeenCalledWith({
      space: 'sp-asset-passport-data',
      externalId: 'note-1',
    });
  });

  it('says which note is being deleted while the delete runs', async () => {
    vi.mocked(noteService.deleteAssetNote).mockReturnValue(new Promise(() => {}));
    const { result } = renderViewModel();

    await waitFor(() => expect(result.current.notes).toHaveLength(1));

    act(() => void result.current.deleteNote(makeAssetNote()));

    await waitFor(() => expect(result.current.isDeleting(makeAssetNote())).toBe(true));
    expect(result.current.isDeleting(makeAssetNote({ externalId: 'note-2' }))).toBe(false);
  });

  it('keeps why a note could not be deleted, without throwing', async () => {
    vi.mocked(noteService.deleteAssetNote).mockRejectedValue(new Error('No write access.'));
    const { result } = renderViewModel();

    await waitFor(() => expect(result.current.notes).toHaveLength(1));

    await act(() => result.current.deleteNote(makeAssetNote()));

    await waitFor(() => expect(result.current.deleteErrorMessage).toBe('No write access.'));
  });

  it('reports a failed load with its error and reads again on retry', async () => {
    vi.mocked(noteService.listAssetNotes).mockRejectedValueOnce(new Error('no access'));
    const { result } = renderViewModel();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('no access'));

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.notes).toHaveLength(1));
  });
});
