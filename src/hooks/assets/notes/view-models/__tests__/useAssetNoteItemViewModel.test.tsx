import type { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeMockClient } from '../../../../../__mocks__/cogniteClient';
import { makeNavigationStore } from '../../../../../__mocks__/navigation';
import { makeAssetNote } from '../../../../../__mocks__/notes';
import {
  makeQueryClientWrapper,
  makeTestQueryClient,
} from '../../../../../__mocks__/QueryClientWrapper';
import { NOTE_UPDATED_MESSAGE } from '../../../../../constants/notes';
import type { AssetNoteService } from '../../../../../services/assets/notes/assetNote';
import { NavigationStoreContext } from '../../../../general/useNavigationState';
import { SuccessToastContext, type ShowSuccessToast } from '../../../../general/useSuccessToast';
import { AssetContext } from '../../../useAssetContext';
import { getAssetNotesQueryKey } from '../../useAssetNotes';
import {
  useAssetNoteItemViewModel,
  UseAssetNoteItemViewModelContext,
} from '../useAssetNoteItemViewModel';

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };

const navigationStore = makeNavigationStore({ selectedAsset: assetIdentifier });
const edit = { title: 'Bearing check', body: 'Runs warm.' };

describe(useAssetNoteItemViewModel.name, () => {
  const client = makeMockClient();
  let queryClient: QueryClient;
  let showSuccessToast: ShowSuccessToast;
  let noteService: Pick<AssetNoteService, 'updateAssetNote'>;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    noteService = { updateAssetNote: vi.fn(() => Promise.resolve()) };
    queryClient = makeTestQueryClient();
    showSuccessToast = vi.fn();
    const QueryWrapper = makeQueryClientWrapper(queryClient);

    wrapper = ({ children }) => (
      <UseAssetNoteItemViewModelContext.Provider
        value={{ createAssetNoteService: () => noteService }}
      >
        <QueryWrapper>
          <AssetContext.Provider value={client}>
            <NavigationStoreContext.Provider value={navigationStore}>
              <SuccessToastContext.Provider value={showSuccessToast}>
                {children}
              </SuccessToastContext.Provider>
            </NavigationStoreContext.Provider>
          </AssetContext.Provider>
        </QueryWrapper>
      </UseAssetNoteItemViewModelContext.Provider>
    );
  });

  function renderViewModel() {
    return renderHook(() => useAssetNoteItemViewModel(makeAssetNote()), {
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

  it('refreshes the notes of the asset and confirms the update after a save', async () => {
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const onSaved = vi.fn();
    const { result } = renderViewModel();

    act(() => result.current.save(edit, onSaved));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: getAssetNotesQueryKey(client.project, assetIdentifier),
    });
    expect(showSuccessToast).toHaveBeenCalledWith(NOTE_UPDATED_MESSAGE);
  });

  it('neither refreshes the notes nor confirms anything when the save fails', async () => {
    vi.mocked(noteService.updateAssetNote).mockRejectedValue(new Error('Forbidden'));
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderViewModel();

    act(() => result.current.save(edit, vi.fn()));

    await waitFor(() => expect(result.current.saveErrorMessage).toBe('Forbidden'));
    expect(invalidate).not.toHaveBeenCalled();
    expect(showSuccessToast).not.toHaveBeenCalled();
  });
});
