import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { usePageDimensions, usePdfPageState } from '../usePdfPageState';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('usePdfPageState', () => {
  it('tracks the page itself when it is not controlled and notifies the parent', () => {
    const onPageChange = vi.fn();
    const { result } = renderHook(() => usePdfPageState({ onPageChange, onPanChange: vi.fn() }));
    expect(result.current.currentPage).toBe(1);

    act(() => result.current.handlePageChange(3));

    expect(result.current.currentPage).toBe(3);
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('prefers the controlled page', () => {
    const { result } = renderHook(() => usePdfPageState({ controlledPage: 2, onPanChange: vi.fn() }));
    expect(result.current.currentPage).toBe(2);
  });

  it('resets the pan when the page changes', () => {
    const onPanChange = vi.fn();
    const { rerender } = renderHook(({ page }) => usePdfPageState({ controlledPage: page, onPanChange }), { initialProps: { page: 1 } });
    onPanChange.mockClear();

    rerender({ page: 2 });

    expect(onPanChange).toHaveBeenCalledWith({ x: 0, y: 0 });
  });
});

describe('usePageDimensions', () => {
  it('measures the wrapper and disconnects the observer on unmount', () => {
    const disconnect = vi.fn();
    vi.stubGlobal('ResizeObserver', class { observe() { return undefined; } disconnect = disconnect; });
    const { result, unmount } = renderHook(() => usePageDimensions());
    const node = document.createElement('div');
    Object.defineProperty(node, 'clientWidth', { value: 300 });
    Object.defineProperty(node, 'clientHeight', { value: 400 });

    act(() => result.current.pageWrapperRef(node));

    expect(result.current.pageDims).toEqual({ width: 300, height: 400 });
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });
});
