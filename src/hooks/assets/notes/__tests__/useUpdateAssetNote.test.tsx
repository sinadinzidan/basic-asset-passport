import type { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeMockClient } from '../../../../__mocks__/cogniteClient';
import {
  makeQueryClientWrapper,
  makeTestQueryClient,
} from '../../../../__mocks__/QueryClientWrapper';
import { NOTE_UPDATED_MESSAGE } from '../../../../constants/notes';
import type { AssetNoteService } from '../../../../services/assets/notes/assetNote';
import { SuccessToastContext, type ShowSuccessToast } from '../../../general/useSuccessToast';
import { AssetContext } from '../../useAssetContext';
import { getAssetNotesQueryKey } from '../useAssetNotes';
import { useUpdateAssetNote, UseUpdateAssetNoteContext } from '../useUpdateAssetNote';

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };
const note = { space: 'data', externalId: 'note-1' };
const input = { title: 'New title', body: 'New text' };

describe(useUpdateAssetNote.name, () => {
  const client = makeMockClient();
  let queryClient: QueryClient;
  let mockContext: Pick<AssetNoteService, 'updateAssetNote'>;
  let showSuccessToast: ShowSuccessToast;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    queryClient = makeTestQueryClient();
    mockContext = {
      updateAssetNote: vi.fn(() => Promise.resolve()),
    };
    showSuccessToast = vi.fn();
    const QueryWrapper = makeQueryClientWrapper(queryClient);

    wrapper = ({ children }) => (
      <UseUpdateAssetNoteContext.Provider value={{ createAssetNoteService: () => mockContext }}>
        <QueryWrapper>
          <SuccessToastContext.Provider value={showSuccessToast}>
            <AssetContext.Provider value={client}>{children}</AssetContext.Provider>
          </SuccessToastContext.Provider>
        </QueryWrapper>
      </UseUpdateAssetNoteContext.Provider>
    );
  });

  it('saves the edited note with the injected client', async () => {
    const { result } = renderHook(() => useUpdateAssetNote(assetIdentifier), {
      wrapper,
    });

    await act(async () => {
      await result.current.updateNote({ note, input });
    });

    expect(mockContext.updateAssetNote).toHaveBeenCalledWith(note, input);
  });

  it('refreshes the notes of that asset after a save', async () => {
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateAssetNote(assetIdentifier), {
      wrapper,
    });

    await act(async () => {
      await result.current.updateNote({ note, input });
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
      await result.current.updateNote({ note, input }).catch(() => undefined);
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(invalidate).not.toHaveBeenCalled();
  });

  it('confirms that the note was updated', async () => {
    const { result } = renderHook(() => useUpdateAssetNote(assetIdentifier), { wrapper });

    await act(async () => {
      await result.current.updateNote({ note, input });
    });

    expect(showSuccessToast).toHaveBeenCalledWith(NOTE_UPDATED_MESSAGE);
  });

  it('confirms nothing when the update fails', async () => {
    vi.mocked(mockContext.updateAssetNote).mockRejectedValue(new Error('Forbidden'));
    const { result } = renderHook(() => useUpdateAssetNote(assetIdentifier), { wrapper });

    await act(async () => {
      await result.current.updateNote({ note, input }).catch(() => undefined);
    });

    expect(showSuccessToast).not.toHaveBeenCalled();
  });
});
