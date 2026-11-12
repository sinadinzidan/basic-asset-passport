import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { makeMockClient } from '../../../mocks/cogniteClient';
import { AssetContext, useAssetContext } from '../useAssetContext';

describe(useAssetContext.name, () => {
  it('returns the client from the provider', () => {
    const client = makeMockClient();

    const { result } = renderHook(() => useAssetContext(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <AssetContext.Provider value={client}>{children}</AssetContext.Provider>
      ),
    });

    expect(result.current).toBe(client);
  });

  it('fails clearly when used outside a provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useAssetContext())).toThrow(
      'useAssetContext must be used inside',
    );
  });
});
