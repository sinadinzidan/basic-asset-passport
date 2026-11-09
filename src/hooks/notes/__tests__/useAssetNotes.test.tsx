import { renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeMockClient } from '../../../mocks/cogniteClient';
import { makeAssetNote } from '../../../mocks/notes';
import { makeQueryClientWrapper } from '../../../mocks/queryClientWrapper';
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
      useAssetDataClient: vi.fn(() => client),
      listAssetNotes: vi.fn(() => Promise.resolve([makeAssetNote()])),
    };
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <UseAssetNotesContext.Provider value={mockContext}>
        <QueryWrapper>{children}</QueryWrapper>
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
    const notes = [makeAssetNote({ externalId: 'note-2' })];
    vi.mocked(mockContext.listAssetNotes).mockResolvedValue(notes);

    const { result } = renderHook(() => useAssetNotes(assetIdentifier), {
      wrapper,
    });

    await waitFor(() => expect(result.current.data).toEqual(notes));
    expect(mockContext.listAssetNotes).toHaveBeenCalledWith(
      client,
      assetIdentifier,
    );
  });

  it('reports a failed load as an error', async () => {
    vi.mocked(mockContext.listAssetNotes).mockRejectedValue(
      new Error('failed'),
    );

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

    await waitFor(() =>
      expect(mockContext.listAssetNotes).toHaveBeenCalledTimes(2),
    );
  });
});
