import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PassportTab } from '../../../enums/passportTab';
import { useAppNavigation } from '../useAppNavigation';

const asset = { space: 'energy', externalId: 'A-1', name: 'Feed pump' };

describe('useAppNavigation', () => {
  it('starts from the saved link and saves each move back to it', async () => {
    const syncInternalState = vi.fn(async () => true);
    const { result } = renderHook(() => useAppNavigation({ syncInternalState }, '{"assetSearch":"pump"}'));
    expect(result.current.state).toEqual({ assetSearch: 'pump' });

    act(() => result.current.selectAsset(asset));
    expect(result.current.state).toEqual({ assetSearch: 'pump', selectedAsset: asset });
    await waitFor(() => expect(syncInternalState).toHaveBeenLastCalledWith(JSON.stringify({ assetSearch: 'pump', selectedAsset: asset })));
    expect(result.current.hasSyncError).toBe(false);
  });

  it('lets two moves in the same moment build on each other', () => {
    const { result } = renderHook(() => useAppNavigation(undefined, undefined));
    act(() => {
      result.current.selectAsset(asset);
      result.current.setPassportTab(PassportTab.DOCUMENTS);
    });
    expect(result.current.state).toEqual({ selectedAsset: asset, passportTab: PassportTab.DOCUMENTS });
  });

  it('flags a failed or refused save and clears the flag on the next move', async () => {
    const syncInternalState = vi.fn<() => Promise<boolean>>().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(true);
    const { result } = renderHook(() => useAppNavigation({ syncInternalState }, undefined));
    act(() => result.current.setPage(1));
    await waitFor(() => expect(result.current.hasSyncError).toBe(true));
    expect(result.current.state).toEqual({ assetPage: 1 });
    act(() => result.current.setPage(2));
    await waitFor(() => expect(result.current.hasSyncError).toBe(false));
  });

  it('works without a host connection', () => {
    const { result } = renderHook(() => useAppNavigation(undefined, undefined));
    act(() => result.current.setPage(3));
    expect(result.current.state).toEqual({ assetPage: 3 });
    act(() => result.current.goHome());
    expect(result.current.state).toEqual({ assetPage: 3 });
  });
});
