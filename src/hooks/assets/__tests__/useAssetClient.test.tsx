import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { makeMockClient } from '../../../__mocks__/cogniteClient';
import { AssetClientContext, useAssetClient } from '../useAssetClient';

describe(useAssetClient.name, () => {
  it('returns the client from the provider', () => {
    const client = makeMockClient();

    const { result } = renderHook(() => useAssetClient(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <AssetClientContext.Provider value={client}>{children}</AssetClientContext.Provider>
      ),
    });

    expect(result.current).toBe(client);
  });

  it('fails clearly when used outside a provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useAssetClient())).toThrow('useAssetClient must be used inside');
  });
});
