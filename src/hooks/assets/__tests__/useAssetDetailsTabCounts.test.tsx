import type { QueryClient } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeMockClient } from '../../../__mocks__/cogniteClient';
import { makeQueryClientWrapper, makeTestQueryClient } from '../../../__mocks__/QueryClientWrapper';
import type { AssetDetailsTabCountService } from '../../../services/assets/assetDetailsTabCounts';
import { getAssetNotesQueryKey } from '../notes/useAssetNotes';
import { AssetContext } from '../useAssetContext';
import {
  UseAssetDetailsTabCountsContext,
  useAssetDetailsTabCounts,
} from '../useAssetDetailsTabCounts';

const assetContext = makeMockClient();

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };

describe(useAssetDetailsTabCounts.name, () => {
  let context: AssetDetailsTabCountService;
  let queryClient: QueryClient;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    context = {
      countAssetEquipment: vi.fn(() => Promise.resolve(1500)),
      countAssetNotes: vi.fn(() => Promise.resolve(2)),
      countAssetTimeseries: vi.fn(() => Promise.resolve(312)),
      countAssetDocuments: vi.fn(() => Promise.resolve(2)),
      countAssetLinkedFiles: vi.fn(() => Promise.resolve(1)),
    };
    queryClient = makeTestQueryClient();
    const QueryWrapper = makeQueryClientWrapper(queryClient);

    wrapper = ({ children }) => (
      <UseAssetDetailsTabCountsContext.Provider
        value={{ createAssetDetailsTabCountService: () => context }}
      >
        <QueryWrapper>
          <AssetContext.Provider value={assetContext}>{children}</AssetContext.Provider>
        </QueryWrapper>
      </UseAssetDetailsTabCountsContext.Provider>
    );
  });

  it('is loading, with no counts, until the counts arrive', () => {
    const { result } = renderHook(() => useAssetDetailsTabCounts(assetIdentifier), {
      wrapper,
    });

    expect(result.current).toEqual({
      equipment: { count: null, isLoading: true },
      timeseries: { count: null, isLoading: true },
      notes: { count: null, isLoading: true },
      documents: { count: null, isLoading: true },
    });
  });

  it('reports the whole number of equipment the server counted, past the most that is listed', async () => {
    const { result } = renderHook(() => useAssetDetailsTabCounts(assetIdentifier), {
      wrapper,
    });

    await waitFor(() =>
      expect(result.current.equipment).toEqual({
        count: 1500,
        isLoading: false,
      }),
    );
  });

  it('reports the number of notes and of series the server counted', async () => {
    const { result } = renderHook(() => useAssetDetailsTabCounts(assetIdentifier), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.notes).toEqual({ count: 2, isLoading: false });
      expect(result.current.timeseries).toEqual({
        count: 312,
        isLoading: false,
      });
    });
  });

  it('adds the uploaded documents to the files already in the model', async () => {
    const { result } = renderHook(() => useAssetDetailsTabCounts(assetIdentifier), {
      wrapper,
    });

    await waitFor(() => expect(result.current.documents).toEqual({ count: 3, isLoading: false }));
  });

  it('is still loading the documents while either of the two counts is', async () => {
    context.countAssetLinkedFiles = vi.fn(() => new Promise<number>(() => undefined));
    const { result } = renderHook(() => useAssetDetailsTabCounts(assetIdentifier), {
      wrapper,
    });

    await waitFor(() => expect(result.current.notes.isLoading).toBe(false));
    expect(result.current.documents).toEqual({ count: null, isLoading: true });
  });

  it('has no count, and is not loading, for a count that failed, and keeps the others', async () => {
    context.countAssetNotes = vi.fn(() => Promise.reject(new Error('no access')));
    const { result } = renderHook(() => useAssetDetailsTabCounts(assetIdentifier), {
      wrapper,
    });

    await waitFor(() => expect(result.current.notes.isLoading).toBe(false));
    expect(result.current.notes).toEqual({ count: null, isLoading: false });
    expect(result.current.timeseries.count).toBe(312);
  });

  it('has no document count when the existing files could not be counted', async () => {
    context.countAssetLinkedFiles = vi.fn(() => Promise.reject(new Error('no access')));
    const { result } = renderHook(() => useAssetDetailsTabCounts(assetIdentifier), {
      wrapper,
    });

    await waitFor(() => expect(result.current.documents.isLoading).toBe(false));
    expect(result.current.documents.count).toBeNull();
  });

  it('counts again when the notes of the asset are refreshed, as after adding one', async () => {
    const { result } = renderHook(() => useAssetDetailsTabCounts(assetIdentifier), {
      wrapper,
    });

    await waitFor(() => expect(result.current.notes.count).toBe(2));
    vi.mocked(context.countAssetNotes).mockResolvedValue(3);

    await queryClient.invalidateQueries({
      queryKey: getAssetNotesQueryKey('asset-passport-test', assetIdentifier),
    });

    await waitFor(() => expect(result.current.notes.count).toBe(3));
  });

  it('does not count again while the counts are still fresh', async () => {
    const { result, rerender } = renderHook(() => useAssetDetailsTabCounts(assetIdentifier), {
      wrapper,
    });

    await waitFor(() => expect(result.current.notes.count).toBe(2));

    rerender();

    expect(context.countAssetNotes).toHaveBeenCalledTimes(1);
  });
});
