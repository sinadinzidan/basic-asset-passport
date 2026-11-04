import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { makeMockClient } from '../../../mocks/cogniteClient';
import {
  AssetDataClientContext,
  useAssetDataClient,
} from '../useAssetDataClient';

describe(useAssetDataClient.name, () => {
  it('returns the client from the provider', () => {
    const client = makeMockClient();

    const { result } = renderHook(() => useAssetDataClient(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <AssetDataClientContext.Provider value={client}>
          {children}
        </AssetDataClientContext.Provider>
      ),
    });

    expect(result.current).toBe(client);
  });

  it('fails clearly when used outside a provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useAssetDataClient())).toThrow(
      'useAssetDataClient must be used inside',
    );
  });
});
