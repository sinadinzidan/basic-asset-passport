import { act, renderHook } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AssetRecord } from '../../../types/asset';
import type { AssetListViewModelContextType } from '../useAssetListViewModel';
import { AssetListViewModelContext , useAssetListViewModel } from '../useAssetListViewModel';

type AssetListResult = ReturnType<AssetListViewModelContextType['useAssetList']>;

describe(useAssetListViewModel.name, () => {
  let mockContext: AssetListViewModelContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    mockContext = { useAssetList: vi.fn() };
    wrapper = ({ children }) => (
      <AssetListViewModelContext.Provider value={mockContext}>{children}</AssetListViewModelContext.Provider>
    );
  });

  it('reports the loading state', () => {
    vi.mocked(mockContext.useAssetList).mockReturnValue(queryResult({ isLoading: true, isFetching: true }));
    const { result } = renderHook(() => useAssetListViewModel(0, ''), { wrapper });
    expect(result.current).toMatchObject({ assets: [], isLoading: true, isFetching: true, hasNextPage: false, errorMessage: undefined });
  });

  it('derives assets, paging and search flags from a successful query', () => {
    const assets = [createAsset('P-1'), createAsset('P-2')];
    vi.mocked(mockContext.useAssetList).mockReturnValue(queryResult({ data: { items: assets, hasMore: true, isSearchLimited: true } }));
    const { result } = renderHook(() => useAssetListViewModel(0, 'pump', 25), { wrapper });
    expect(mockContext.useAssetList).toHaveBeenCalledWith(0, 'pump', 25);
    expect(result.current).toMatchObject({ assets, hasNextPage: true, isSearchLimited: true, hasNoMatches: false });
  });

  it('uses the cursor to decide whether a next page exists when browsing', () => {
    vi.mocked(mockContext.useAssetList).mockReturnValue(queryResult({ data: { items: [], nextCursor: { assets: 'next' } } }));
    const { result } = renderHook(() => useAssetListViewModel(0, ''), { wrapper });
    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.hasNoMatches).toBe(false);
  });

  it('flags a search that matched nothing', () => {
    vi.mocked(mockContext.useAssetList).mockReturnValue(queryResult({ data: { items: [], hasMore: false } }));
    const { result } = renderHook(() => useAssetListViewModel(0, 'zzz'), { wrapper });
    expect(result.current.hasNoMatches).toBe(true);
  });

  it('exposes the error message and a retry action', () => {
    const refetch = vi.fn();
    vi.mocked(mockContext.useAssetList).mockReturnValue(queryResult({ error: new Error('Forbidden'), refetch }));
    const { result } = renderHook(() => useAssetListViewModel(0, ''), { wrapper });
    expect(result.current.errorMessage).toBe('Forbidden');
    act(() => result.current.retry());
    expect(refetch).toHaveBeenCalledOnce();
  });
});

function createAsset(externalId: string): AssetRecord {
  return { id: externalId, space: 'assets', externalId, name: externalId };
}

function queryResult(overrides: Partial<AssetListResult>): AssetListResult {
  return { data: undefined, isLoading: false, isFetching: false, error: null, refetch: vi.fn(), ...overrides } as Partial<AssetListResult> as AssetListResult;
}
