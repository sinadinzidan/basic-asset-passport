import { act, renderHook } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DebounceContext,
  type DebounceDeps,
  useDebouncedCallback,
} from '../useDebouncedCallback';

describe(useDebouncedCallback.name, () => {
  let scheduled: Map<number, () => void>;
  let nextHandle: number;
  let deps: DebounceDeps;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    scheduled = new Map();
    nextHandle = 1;
    deps = {
      setTimer: vi.fn((callback: () => void) => {
        const handle = nextHandle++;
        scheduled.set(handle, callback);
        return handle;
      }),
      clearTimer: vi.fn((handle: number) => {
        scheduled.delete(handle);
      }),
    };
    wrapper = ({ children }) => (
      <DebounceContext.Provider value={deps}>
        {children}
      </DebounceContext.Provider>
    );
  });

  it('calls back once the delay has passed', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300), {
      wrapper,
    });

    act(() => result.current.run('pump'));

    expect(deps.setTimer).toHaveBeenCalledWith(expect.any(Function), 300);
    expect(callback).not.toHaveBeenCalled();
    act(() => fireScheduled());
    expect(callback).toHaveBeenCalledExactlyOnceWith('pump');
  });

  it('keeps only the latest call', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300), {
      wrapper,
    });

    act(() => result.current.run('p'));
    act(() => result.current.run('pu'));

    expect(scheduled.size).toBe(1);
    act(() => fireScheduled());
    expect(callback).toHaveBeenCalledExactlyOnceWith('pu');
  });

  it('calls the latest callback, not the one from the first render', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { result, rerender } = renderHook(
      ({ callback }) => useDebouncedCallback(callback, 300),
      { wrapper, initialProps: { callback: first } },
    );
    act(() => result.current.run('pump'));

    rerender({ callback: second });
    act(() => fireScheduled());

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith('pump');
  });

  it('drops a pending call when cancelled', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300), {
      wrapper,
    });
    act(() => result.current.run('pump'));

    act(() => result.current.cancel());

    expect(scheduled.size).toBe(0);
    expect(callback).not.toHaveBeenCalled();
  });

  it('drops a pending call when the component unmounts', () => {
    const callback = vi.fn();
    const { result, unmount } = renderHook(
      () => useDebouncedCallback(callback, 300),
      { wrapper },
    );
    act(() => result.current.run('pump'));

    unmount();

    expect(scheduled.size).toBe(0);
  });

  function fireScheduled(): void {
    for (const callback of [...scheduled.values()]) callback();
    scheduled.clear();
  }
});
