import type { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeMockClient } from '../../../../__mocks__/cogniteClient';
import {
  makeQueryClientWrapper,
  makeTestQueryClient,
} from '../../../../__mocks__/QueryClientWrapper';
import { NOTE_ADDED_MESSAGE } from '../../../../constants/notes';
import type { AssetNoteService } from '../../../../services/assets/notes/assetNote';
import { SuccessToastContext, type ShowSuccessToast } from '../../../general/useSuccessToast';
import { AssetContext } from '../../useAssetContext';
import { useAddAssetNote, UseAddAssetNoteContext } from '../useAddAssetNote';
import { getAssetNotesQueryKey } from '../useAssetNotes';

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };
const newNote = { title: 'Inspection', body: 'All good' };

describe(useAddAssetNote.name, () => {
  const client = makeMockClient();
  let queryClient: QueryClient;
  let mockContext: Pick<AssetNoteService, 'createAssetNote'>;
  let showSuccessToast: ShowSuccessToast;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    queryClient = makeTestQueryClient();
    mockContext = {
      createAssetNote: vi.fn(() => Promise.resolve()),
    };
    showSuccessToast = vi.fn();
    const QueryWrapper = makeQueryClientWrapper(queryClient);

    wrapper = ({ children }) => (
      <UseAddAssetNoteContext.Provider value={{ createAssetNoteService: () => mockContext }}>
        <QueryWrapper>
          <SuccessToastContext.Provider value={showSuccessToast}>
            <AssetContext.Provider value={client}>{children}</AssetContext.Provider>
          </SuccessToastContext.Provider>
        </QueryWrapper>
      </UseAddAssetNoteContext.Provider>
    );
  });

  it('creates the note for the asset with the injected client', async () => {
    const { result } = renderHook(() => useAddAssetNote(assetIdentifier), {
      wrapper,
    });

    await act(async () => {
      await result.current.addNote(newNote);
    });

    expect(mockContext.createAssetNote).toHaveBeenCalledWith(assetIdentifier, newNote);
  });

  it('refreshes the notes of that asset after a save', async () => {
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useAddAssetNote(assetIdentifier), {
      wrapper,
    });

    await act(async () => {
      await result.current.addNote(newNote);
    });

    expect(invalidate).toHaveBeenCalledWith({
      queryKey: getAssetNotesQueryKey(client.project, assetIdentifier),
    });
  });

  it('reports a failed save and does not refresh the notes', async () => {
    vi.mocked(mockContext.createAssetNote).mockRejectedValue(new Error('Forbidden'));
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useAddAssetNote(assetIdentifier), {
      wrapper,
    });

    await act(async () => {
      await result.current.addNote(newNote).catch(() => undefined);
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(invalidate).not.toHaveBeenCalled();
  });

  it('confirms that the note was added', async () => {
    const { result } = renderHook(() => useAddAssetNote(assetIdentifier), { wrapper });

    await act(async () => {
      await result.current.addNote(newNote);
    });

    expect(showSuccessToast).toHaveBeenCalledWith(NOTE_ADDED_MESSAGE);
  });

  it('confirms nothing when the save fails', async () => {
    vi.mocked(mockContext.createAssetNote).mockRejectedValue(new Error('Forbidden'));
    const { result } = renderHook(() => useAddAssetNote(assetIdentifier), { wrapper });

    await act(async () => {
      await result.current.addNote(newNote).catch(() => undefined);
    });

    expect(showSuccessToast).not.toHaveBeenCalled();
  });
});
