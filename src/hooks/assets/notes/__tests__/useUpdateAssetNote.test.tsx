import type { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeMockClient } from '../../../../mocks/cogniteClient';
import { makeQueryClientWrapper, makeTestQueryClient } from '../../../../mocks/QueryClientWrapper';
import { AssetContext } from '../../useAssetContext';
import { getAssetNotesQueryKey } from '../useAssetNotes';
import {
  useUpdateAssetNote,
  UseUpdateAssetNoteContext,
  type UseUpdateAssetNoteContextType,
} from '../useUpdateAssetNote';

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };
const note = { space: 'data', externalId: 'note-1' };
const input = { title: 'New title', body: 'New text' };

describe(useUpdateAssetNote.name, () => {
  const client = makeMockClient();
  let queryClient: QueryClient;
  let mockContext: UseUpdateAssetNoteContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    queryClient = makeTestQueryClient();
    mockContext = {
      updateAssetNote: vi.fn(() => Promise.resolve()),
    };
    const QueryWrapper = makeQueryClientWrapper(queryClient);
    wrapper = ({ children }) => (
      <UseUpdateAssetNoteContext.Provider value={mockContext}>
        <QueryWrapper>
          <AssetContext.Provider value={client}>{children}</AssetContext.Provider>
        </QueryWrapper>
      </UseUpdateAssetNoteContext.Provider>
    );
  });

  it('saves the edited note with the injected client', async () => {
    const { result } = renderHook(() => useUpdateAssetNote(assetIdentifier), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({ note, input });
    });

    expect(mockContext.updateAssetNote).toHaveBeenCalledWith(client, note, input);
  });

  it('refreshes the notes of that asset after a save', async () => {
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateAssetNote(assetIdentifier), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({ note, input });
    });

    expect(invalidate).toHaveBeenCalledWith({
      queryKey: getAssetNotesQueryKey(client.project, assetIdentifier),
    });
  });

  it('reports a failed save and does not refresh the list', async () => {
    vi.mocked(mockContext.updateAssetNote).mockRejectedValue(new Error('Forbidden'));
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateAssetNote(assetIdentifier), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({ note, input }).catch(() => undefined);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidate).not.toHaveBeenCalled();
  });
});
