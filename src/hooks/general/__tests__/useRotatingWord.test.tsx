import { act, renderHook } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  UseRotatingWordContext,
  type UseRotatingWordContextType,
  useRotatingWord,
} from '../useRotatingWord';

const WORDS = ['One', 'Two', 'Three'];

describe(useRotatingWord.name, () => {
  let tick: () => void;
  let stopTicker: () => void;
  let context: UseRotatingWordContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    tick = () => {};
    stopTicker = vi.fn();
    context = {
      startTicker: vi.fn((onTick) => {
        tick = onTick;

        return stopTicker;
      }),
      pickStartIndex: vi.fn(() => 1),
    };
    wrapper = ({ children }) => (
      <UseRotatingWordContext.Provider value={context}>{children}</UseRotatingWordContext.Provider>
    );
  });

  it('starts on the word the context picks', () => {
    const { result } = renderHook(() => useRotatingWord(WORDS, 1000), {
      wrapper,
    });

    expect(result.current).toBe('Two');
    expect(context.pickStartIndex).toHaveBeenCalledWith(WORDS.length);
  });

  it('moves to the next word on every tick and wraps around', () => {
    const { result } = renderHook(() => useRotatingWord(WORDS, 1000), {
      wrapper,
    });

    act(() => tick());
    expect(result.current).toBe('Three');
    act(() => tick());
    expect(result.current).toBe('One');
  });

  it('ticks at the given interval', () => {
    renderHook(() => useRotatingWord(WORDS, 1500), { wrapper });

    expect(context.startTicker).toHaveBeenCalledWith(expect.any(Function), 1500);
  });

  it('stops ticking when it goes away', () => {
    const { unmount } = renderHook(() => useRotatingWord(WORDS, 1000), {
      wrapper,
    });

    unmount();

    expect(stopTicker).toHaveBeenCalledTimes(1);
  });

  it('has no word when there are none', () => {
    const { result } = renderHook(() => useRotatingWord([], 1000), { wrapper });

    expect(result.current).toBe('');
  });
});
