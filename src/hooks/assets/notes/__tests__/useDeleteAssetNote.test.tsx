import type { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeMockClient } from '../../../../__mocks__/cogniteClient';
import {
  makeQueryClientWrapper,
  makeTestQueryClient,
} from '../../../../__mocks__/QueryClientWrapper';
import { AssetContext } from '../../useAssetContext';
import { getAssetNotesQueryKey } from '../useAssetNotes';
import {
  useDeleteAssetNote,
  UseDeleteAssetNoteContext,
  type UseDeleteAssetNoteContextType,
} from '../useDeleteAssetNote';

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };
const note = { space: 'data', externalId: 'note-1' };

describe(useDeleteAssetNote.name, () => {
  const client = makeMockClient();
  let queryClient: QueryClient;
  let mockContext: UseDeleteAssetNoteContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    queryClient = makeTestQueryClient();
    mockContext = {
      deleteAssetNote: vi.fn(() => Promise.resolve()),
    };
    const QueryWrapper = makeQueryClientWrapper(queryClient);
    wrapper = ({ children }) => (
      <UseDeleteAssetNoteContext.Provider value={mockContext}>
        <QueryWrapper>
          <AssetContext.Provider value={client}>{children}</AssetContext.Provider>
        </QueryWrapper>
      </UseDeleteAssetNoteContext.Provider>
    );
  });

  it('deletes the note with the injected client', async () => {
    const { result } = renderHook(() => useDeleteAssetNote(assetIdentifier), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(note);
    });

    expect(mockContext.deleteAssetNote).toHaveBeenCalledWith(client, note);
  });

  it('refreshes the notes of that asset after a delete', async () => {
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteAssetNote(assetIdentifier), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(note);
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
      await result.current.mutateAsync(note).catch(() => undefined);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidate).not.toHaveBeenCalled();
  });
});
