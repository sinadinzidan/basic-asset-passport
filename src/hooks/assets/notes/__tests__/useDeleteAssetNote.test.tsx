import type { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeMockClient } from '../../../../__mocks__/cogniteClient';
import {
  makeQueryClientWrapper,
  makeTestQueryClient,
} from '../../../../__mocks__/QueryClientWrapper';
import { NOTE_DELETED_MESSAGE } from '../../../../constants/notes';
import type { AssetNoteService } from '../../../../services/assets/notes/assetNote';
import { SuccessToastContext, type ShowSuccessToast } from '../../../general/useSuccessToast';
import { AssetContext } from '../../useAssetContext';
import { getAssetNotesQueryKey } from '../useAssetNotes';
import { useDeleteAssetNote, UseDeleteAssetNoteContext } from '../useDeleteAssetNote';

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };
const note = { space: 'data', externalId: 'note-1' };

describe(useDeleteAssetNote.name, () => {
  const client = makeMockClient();
  let queryClient: QueryClient;
  let mockContext: Pick<AssetNoteService, 'deleteAssetNote'>;
  let showSuccessToast: ShowSuccessToast;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    queryClient = makeTestQueryClient();
    mockContext = {
      deleteAssetNote: vi.fn(() => Promise.resolve()),
    };
    showSuccessToast = vi.fn();
    const QueryWrapper = makeQueryClientWrapper(queryClient);

    wrapper = ({ children }) => (
      <UseDeleteAssetNoteContext.Provider value={{ createAssetNoteService: () => mockContext }}>
        <QueryWrapper>
          <SuccessToastContext.Provider value={showSuccessToast}>
            <AssetContext.Provider value={client}>{children}</AssetContext.Provider>
          </SuccessToastContext.Provider>
        </QueryWrapper>
      </UseDeleteAssetNoteContext.Provider>
    );
  });

  it('deletes the note with the injected client', async () => {
    const { result } = renderHook(() => useDeleteAssetNote(assetIdentifier), {
      wrapper,
    });

    await act(async () => {
      await result.current.deleteNote(note);
    });

    expect(mockContext.deleteAssetNote).toHaveBeenCalledWith(note);
  });

  it('refreshes the notes of that asset after a delete', async () => {
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteAssetNote(assetIdentifier), {
      wrapper,
    });

    await act(async () => {
      await result.current.deleteNote(note);
    });

    expect(invalidate).toHaveBeenCalledWith({
      queryKey: getAssetNotesQueryKey(client.project, assetIdentifier),
    });
  });

  it('reports a failed delete and does not refresh the list', async () => {
    vi.mocked(mockContext.deleteAssetNote).mockRejectedValue(new Error('Forbidden'));
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteAssetNote(assetIdentifier), {
      wrapper,
    });

    await act(async () => {
      await result.current.deleteNote(note).catch(() => undefined);
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(invalidate).not.toHaveBeenCalled();
  });

  it('confirms that the note was deleted', async () => {
    const { result } = renderHook(() => useDeleteAssetNote(assetIdentifier), { wrapper });

    await act(async () => {
      await result.current.deleteNote(note);
    });

    expect(showSuccessToast).toHaveBeenCalledWith(NOTE_DELETED_MESSAGE);
  });

  it('confirms nothing when the delete fails', async () => {
    vi.mocked(mockContext.deleteAssetNote).mockRejectedValue(new Error('Forbidden'));
    const { result } = renderHook(() => useDeleteAssetNote(assetIdentifier), { wrapper });

    await act(async () => {
      await result.current.deleteNote(note).catch(() => undefined);
    });

    expect(showSuccessToast).not.toHaveBeenCalled();
  });
});
