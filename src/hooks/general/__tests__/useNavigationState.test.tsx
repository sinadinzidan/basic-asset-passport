import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { NavigationProvider } from '../../../providers/general/NavigationProvider';
import { useNavigationState } from '../useNavigationState';

describe(useNavigationState.name, () => {
  it('shares one screen state with everything under the provider', () => {
    const { result } = renderHook(
      () => useNavigationState((store) => store.navigationState.isAssistantOpen),
      { wrapper: makeWrapper(JSON.stringify({ isAssistantOpen: true })) },
    );

    expect(result.current).toBe(true);
  });

  it('renders again only when the slice it reads changes', () => {
    const wrapper = makeWrapper();
    let renderCount = 0;
    const { result } = renderHook(
      () => {
        renderCount += 1;
        return {
          isOpen: useNavigationState((store) => store.navigationState.isAssistantOpen === true),
          actions: useNavigationState((store) => store.actions),
        };
      },
      { wrapper },
    );
    const rendersBefore = renderCount;

    act(() => result.current.actions.changeSearchQuery('pump'));
    expect(renderCount).toBe(rendersBefore);

    act(() => result.current.actions.changeAssistantOpen(true));
    expect(result.current.isOpen).toBe(true);
    expect(renderCount).toBe(rendersBefore + 1);
  });

  it('says so when there is no provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useNavigationState((store) => store.actions))).toThrow(
      'useNavigationState must be used inside a NavigationProvider.',
    );
  });
});

function makeWrapper(initialState?: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <NavigationProvider api={null} initialState={initialState}>
        {children}
      </NavigationProvider>
    );
  };
}
