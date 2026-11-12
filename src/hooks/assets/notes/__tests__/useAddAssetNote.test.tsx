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
import {
  useAddAssetNote,
  UseAddAssetNoteContext,
  type UseAddAssetNoteContextType,
} from '../useAddAssetNote';
import { getAssetNotesQueryKey } from '../useAssetNotes';

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };
const newNote = { title: 'Inspection', body: 'All good' };

describe(useAddAssetNote.name, () => {
  const client = makeMockClient();
  let queryClient: QueryClient;
  let mockContext: UseAddAssetNoteContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    queryClient = makeTestQueryClient();
    mockContext = {
      createAssetNote: vi.fn(() => Promise.resolve()),
    };
    const QueryWrapper = makeQueryClientWrapper(queryClient);
    wrapper = ({ children }) => (
      <UseAddAssetNoteContext.Provider value={mockContext}>
        <QueryWrapper>
          <AssetContext.Provider value={client}>{children}</AssetContext.Provider>
        </QueryWrapper>
      </UseAddAssetNoteContext.Provider>
    );
  });

  it('creates the note for the asset with the injected client', async () => {
    const { result } = renderHook(() => useAddAssetNote(assetIdentifier), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(newNote);
    });

    expect(mockContext.createAssetNote).toHaveBeenCalledWith(client, assetIdentifier, newNote);
  });

  it('refreshes the notes of that asset after a save', async () => {
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useAddAssetNote(assetIdentifier), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(newNote);
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
      await result.current.mutateAsync(newNote).catch(() => undefined);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidate).not.toHaveBeenCalled();
  });
});
