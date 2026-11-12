import { act, renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeAssetsKPICountsContext } from '../../../__mocks__/assetsKPICounts';
import { makeMockClient } from '../../../__mocks__/cogniteClient';
import { makeQueryClientWrapper } from '../../../__mocks__/QueryClientWrapper';
import type { AssetsKPICountService } from '../../../services/assets/assetsKPICounts';
import { AssetContext } from '../useAssetContext';
import { UseAssetsKPICountsContext, useAssetsKPICounts } from '../useAssetsKPICounts';

describe(useAssetsKPICounts.name, () => {
  const client = makeMockClient();
  let context: AssetsKPICountService;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    context = makeAssetsKPICountsContext();
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <AssetContext.Provider value={client}>
        <UseAssetsKPICountsContext.Provider value={{ createAssetsKPICountService: () => context }}>
          <QueryWrapper>{children}</QueryWrapper>
        </UseAssetsKPICountsContext.Provider>
      </AssetContext.Provider>
    );
  });

  it('is loading, with no counts, until the counts arrive', () => {
    const { result } = renderHook(() => useAssetsKPICounts(), { wrapper });

    expect(result.current).toMatchObject({
      assets: { count: null, isLoading: true },
      operating: { count: null, isLoading: true },
      equipment: { count: null, isLoading: true },
      error: null,
    });
  });

  it('reports the whole number the server counted for each card', async () => {
    const { result } = renderHook(() => useAssetsKPICounts(), { wrapper });

    await waitFor(() => expect(result.current.equipment.isLoading).toBe(false));

    expect(result.current).toMatchObject({
      assets: { count: 4210, isLoading: false },
      operating: { count: 3800, isLoading: false },
      equipment: { count: 18500, isLoading: false },
      error: null,
    });
  });

  it('asks for all three at once, without waiting for one another', () => {
    renderHook(() => useAssetsKPICounts(), { wrapper });

    return waitFor(() => {
      expect(context.countAllAssets).toHaveBeenCalledOnce();
      expect(context.countOperatingAssets).toHaveBeenCalledOnce();
      expect(context.countAllEquipment).toHaveBeenCalledOnce();
    });
  });

  it('leaves a count that could not be read without a figure while the others still show', async () => {
    vi.mocked(context.countAllEquipment).mockRejectedValue(new Error('forbidden'));

    const { result } = renderHook(() => useAssetsKPICounts(), { wrapper });

    await waitFor(() => expect(result.current.equipment.isLoading).toBe(false));
    expect(result.current.equipment).toEqual({ count: null, isLoading: false });
    expect(result.current.assets.count).toBe(4210);
  });

  it('reports why a count could not be read', async () => {
    const failure = new Error('forbidden');
    vi.mocked(context.countAllEquipment).mockRejectedValue(failure);

    const { result } = renderHook(() => useAssetsKPICounts(), { wrapper });

    await waitFor(() => expect(result.current.error).toBe(failure));
  });

  it('reads only the failed counts again on retry', async () => {
    vi.mocked(context.countAllEquipment).mockRejectedValueOnce(new Error('forbidden'));
    const { result } = renderHook(() => useAssetsKPICounts(), { wrapper });
    await waitFor(() => expect(result.current.error).not.toBeNull());

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.equipment.count).toBe(18500));
    expect(result.current.error).toBeNull();
    expect(context.countAllEquipment).toHaveBeenCalledTimes(2);
    expect(context.countAllAssets).toHaveBeenCalledOnce();
  });

  it('does not ask again for counts it already holds', async () => {
    const { result, rerender } = renderHook(() => useAssetsKPICounts(), { wrapper });
    await waitFor(() => expect(result.current.assets.isLoading).toBe(false));

    rerender();

    expect(context.countAllAssets).toHaveBeenCalledOnce();
  });
});
