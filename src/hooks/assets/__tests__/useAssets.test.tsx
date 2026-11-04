import { renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeAssetPage } from '../../../mocks/assets';
import { makeMockClient } from '../../../mocks/cogniteClient';
import { makeQueryClientWrapper } from '../../../mocks/queryClientWrapper';
import {
  useAssets,
  UseAssetsContext,
  type UseAssetsContextType,
} from '../useAssets';

describe(useAssets.name, () => {
  const client = makeMockClient();
  let mockContext: UseAssetsContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    mockContext = {
      useAssetDataClient: vi.fn(() => client),
      listAssets: vi.fn(() => Promise.resolve(makeAssetPage())),
    };
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <UseAssetsContext.Provider value={mockContext}>
        <QueryWrapper>{children}</QueryWrapper>
      </UseAssetsContext.Provider>
    );
  });

  it('is pending until the first page arrives', async () => {
    const { result } = renderHook(() => useAssets(), { wrapper });

    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('loads the requested page with the injected client', async () => {
    const page = makeAssetPage([], 'next-cursor');
    vi.mocked(mockContext.listAssets).mockResolvedValue(page);

    const { result } = renderHook(() => useAssets('current-cursor'), {
      wrapper,
    });

    await waitFor(() => expect(result.current.data).toEqual(page));
    expect(mockContext.listAssets).toHaveBeenCalledWith(
      client,
      'current-cursor',
    );
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
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    rerender({ cursor: 'page-2' });

    await waitFor(() =>
      expect(mockContext.listAssets).toHaveBeenCalledTimes(2),
    );
  });
});
