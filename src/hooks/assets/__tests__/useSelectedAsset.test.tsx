import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { makeNavigationStore } from '../../../__mocks__/navigation';
import { NavigationStoreContext } from '../../general/useNavigationState';
import { useSelectedAsset } from '../useSelectedAsset';

const pump = { space: 'asset-space', externalId: 'FLOC-1' };
const valve = { space: 'asset-space', externalId: 'FLOC-2' };

describe(useSelectedAsset.name, () => {
  it('gives the asset that is open', () => {
    const { result } = renderWithStore(makeNavigationStore({ selectedAsset: pump }));

    expect(result.current).toEqual(pump);
  });

  it('follows the store when another asset is opened', () => {
    const store = makeNavigationStore({ selectedAsset: pump });
    const { result } = renderWithStore(store);

    act(() => store.getState().actions.selectAsset(valve));

    expect(result.current).toEqual(valve);
  });

  it('fails loudly when no asset is open', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => renderWithStore(makeNavigationStore())).toThrow(
      'useSelectedAsset must be used while an asset is open.',
    );
  });
});

function renderWithStore(store: ReturnType<typeof makeNavigationStore>) {
  return renderHook(() => useSelectedAsset(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <NavigationStoreContext.Provider value={store}>{children}</NavigationStoreContext.Provider>
    ),
  });
}
