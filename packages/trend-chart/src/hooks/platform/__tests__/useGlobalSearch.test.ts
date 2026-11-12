import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SEARCH_DEBOUNCE_MS } from '../../../constants/formats';
import { useDebouncedText } from '../useGlobalSearch';

describe(useDebouncedText.name, () => {
  // The hook reads the window's timer directly, so the tests drive it with fake timers.
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('gives the first text at once', () => {
    const { result } = renderHook(() => useDebouncedText('pump'));

    expect(result.current).toBe('pump');
  });

  it('keeps the earlier text until the typing pause has passed', () => {
    const { result, rerender } = renderHook(({ text }) => useDebouncedText(text), {
      initialProps: { text: 'pu' },
    });

    rerender({ text: 'pump' });
    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1);
    });

    expect(result.current).toBe('pu');
  });

  it('gives the new text once the typing pause has passed', () => {
    const { result, rerender } = renderHook(({ text }) => useDebouncedText(text), {
      initialProps: { text: 'pu' },
    });

    rerender({ text: 'pump' });
    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    });

    expect(result.current).toBe('pump');
  });

  it('starts the pause again with each change, so text in between is never given', () => {
    const { result, rerender } = renderHook(({ text }) => useDebouncedText(text), {
      initialProps: { text: 'p' },
    });

    rerender({ text: 'pu' });
    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1);
    });
    rerender({ text: 'pump' });
    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1);
    });

    expect(result.current).toBe('p');
  });

  it('waits as long as it is told to', () => {
    const { result, rerender } = renderHook(({ text }) => useDebouncedText(text, 1000), {
      initialProps: { text: 'pu' },
    });

    rerender({ text: 'pump' });
    act(() => {
      vi.advanceTimersByTime(999);
    });
    const beforeThePause = result.current;
    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(beforeThePause).toBe('pu');
    expect(result.current).toBe('pump');
  });
});
