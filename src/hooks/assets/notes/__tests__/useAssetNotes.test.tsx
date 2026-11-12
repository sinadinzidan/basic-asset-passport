import { renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeMockClient } from '../../../../__mocks__/cogniteClient';
import { makeLimitedList } from '../../../../__mocks__/lists';
import { makeAssetNote } from '../../../../__mocks__/notes';
import { makeQueryClientWrapper } from '../../../../__mocks__/QueryClientWrapper';
import { NOTE_QUERY_LIMIT } from '../../../../constants/notes';
import type { LimitedList } from '../../../../types/list';
import type { AssetNote } from '../../../../types/note';
import { AssetContext } from '../../useAssetContext';
import {
  useAssetNotes,
  UseAssetNotesContext,
  type UseAssetNotesContextType,
} from '../useAssetNotes';

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };

describe(useAssetNotes.name, () => {
  const client = makeMockClient();
  let mockContext: UseAssetNotesContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    mockContext = {
      listAssetNotes: vi.fn(() => Promise.resolve(makeLimitedList([makeAssetNote()]))),
    };
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <UseAssetNotesContext.Provider value={mockContext}>
        <QueryWrapper>
          <AssetContext.Provider value={client}>{children}</AssetContext.Provider>
        </QueryWrapper>
      </UseAssetNotesContext.Provider>
    );
  });

  it('is pending until the notes arrive', async () => {
    const { result } = renderHook(() => useAssetNotes(assetIdentifier), {
      wrapper,
    });

    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('loads the notes of the asset with the injected client', async () => {
    const notes = makeLimitedList([makeAssetNote({ externalId: 'note-2' })]);
    vi.mocked(mockContext.listAssetNotes).mockResolvedValue(notes);

    const { result } = renderHook(() => useAssetNotes(assetIdentifier), {
      wrapper,
    });

    await waitFor(() => expect(result.current.data).toEqual(notes));
    expect(mockContext.listAssetNotes).toHaveBeenCalledWith(
      client,
      assetIdentifier,
      NOTE_QUERY_LIMIT,
    );
  });

  it('reads on to a longer limit while the notes already read stay', async () => {
    // Arrange
    const firstPage = makeLimitedList([makeAssetNote({ externalId: 'note-1' })], true);
    const longer = deferred<LimitedList<AssetNote>>();
    vi.mocked(mockContext.listAssetNotes)
      .mockResolvedValueOnce(firstPage)
      .mockReturnValueOnce(longer.promise);
    const { result, rerender } = renderHook(({ limit }) => useAssetNotes(assetIdentifier, limit), {
      wrapper,
      initialProps: { limit: 1 },
    });
    await waitFor(() => expect(result.current.data).toEqual(firstPage));

    // Act
    rerender({ limit: 2 });

    // Assert
    expect(result.current.data).toEqual(firstPage);
    expect(result.current.isPlaceholderData).toBe(true);
    expect(mockContext.listAssetNotes).toHaveBeenLastCalledWith(client, assetIdentifier, 2);
    longer.resolve(makeLimitedList([makeAssetNote()]));
    await waitFor(() => expect(result.current.isPlaceholderData).toBe(false));
  });

  it('never shows the notes of another asset while its own load', async () => {
    // Arrange
    const otherAsset = { space: 'asset-space', externalId: 'FLOC-2' };
    vi.mocked(mockContext.listAssetNotes)
      .mockResolvedValueOnce(makeLimitedList([makeAssetNote()]))
      .mockReturnValueOnce(deferred<LimitedList<AssetNote>>().promise);
    const { result, rerender } = renderHook(({ asset }) => useAssetNotes(asset), {
      wrapper,
      initialProps: { asset: assetIdentifier },
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Act
    rerender({ asset: otherAsset });

    // Assert
    expect(result.current.data).toBeUndefined();
    expect(result.current.isPending).toBe(true);
  });

  it('reports a failed load as an error', async () => {
    vi.mocked(mockContext.listAssetNotes).mockRejectedValue(new Error('failed'));

    const { result } = renderHook(() => useAssetNotes(assetIdentifier), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('caches the notes of each asset separately', async () => {
    const { result, rerender } = renderHook(
      ({ externalId }: { externalId: string }) =>
        useAssetNotes({ space: 'asset-space', externalId }),
      { wrapper, initialProps: { externalId: 'FLOC-1' } },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    rerender({ externalId: 'FLOC-2' });

    await waitFor(() => expect(mockContext.listAssetNotes).toHaveBeenCalledTimes(2));
  });
});

function deferred<Value>() {
  let resolve: (value: Value) => void = () => {};
  const promise = new Promise<Value>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}
