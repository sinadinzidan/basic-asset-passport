import { renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeAssetListItem, makeAssetPage } from '../../../__mocks__/assets';
import { makeMockClient } from '../../../__mocks__/cogniteClient';
import { makeQueryClientWrapper } from '../../../__mocks__/QueryClientWrapper';
import { AssetContext } from '../useAssetContext';
import { useAssets, UseAssetsContext, type UseAssetsContextType } from '../useAssets';

describe(useAssets.name, () => {
  const client = makeMockClient();
  let mockContext: UseAssetsContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    mockContext = {
      listAssets: vi.fn(() => Promise.resolve(makeAssetPage())),
      searchAssets: vi.fn(() => Promise.resolve(makeAssetPage())),
    };
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <UseAssetsContext.Provider value={mockContext}>
        <QueryWrapper>
          <AssetContext.Provider value={client}>{children}</AssetContext.Provider>
        </QueryWrapper>
      </UseAssetsContext.Provider>
    );
  });

  it('is pending until the first page arrives', async () => {
    const { result } = renderHook(() => useAssets(), { wrapper });

    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it('loads the requested page with the injected client', async () => {
    const page = makeAssetPage([], 'next-cursor');
    vi.mocked(mockContext.listAssets).mockResolvedValue(page);

    const { result } = renderHook(() => useAssets('current-cursor'), {
      wrapper,
    });

    await waitFor(() => expect(result.current.data).toEqual(page));
    expect(mockContext.listAssets).toHaveBeenCalledWith(client, 'current-cursor');
  });

  it('reports a failed load as an error', async () => {
    vi.mocked(mockContext.listAssets).mockRejectedValue(new Error('failed'));

    const { result } = renderHook(() => useAssets(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('caches each cursor separately', async () => {
    const { result, rerender } = renderHook(
      ({ cursor }: { cursor?: string }) => useAssets(cursor),
      { wrapper, initialProps: {} },
    );
    await waitFor(() => expect(result.current.isPending).toBe(false));

    rerender({ cursor: 'page-2' });

    await waitFor(() => expect(mockContext.listAssets).toHaveBeenCalledTimes(2));
  });

  it('searches instead of listing when there is search text', async () => {
    const page = makeAssetPage([makeAssetListItem({ externalId: 'FOUND' })]);
    vi.mocked(mockContext.searchAssets).mockResolvedValue(page);

    const { result } = renderHook(() => useAssets(undefined, 'pump'), {
      wrapper,
    });

    await waitFor(() => expect(result.current.data).toEqual(page));
    expect(mockContext.searchAssets).toHaveBeenCalledWith(client, 'pump');
    expect(mockContext.listAssets).not.toHaveBeenCalled();
  });

  it('lists when the search text is blank', async () => {
    const { result } = renderHook(() => useAssets(undefined, '   '), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(mockContext.listAssets).toHaveBeenCalledWith(client, undefined);
    expect(mockContext.searchAssets).not.toHaveBeenCalled();
  });

  it('caches each search text separately', async () => {
    const { result, rerender } = renderHook(
      ({ searchText }: { searchText: string }) => useAssets(undefined, searchText),
      { wrapper, initialProps: { searchText: 'pump' } },
    );
    await waitFor(() => expect(result.current.isPending).toBe(false));

    rerender({ searchText: 'valve' });

    await waitFor(() => expect(mockContext.searchAssets).toHaveBeenCalledWith(client, 'valve'));
  });
});
