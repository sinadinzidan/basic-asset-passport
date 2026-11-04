import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useCursorPagination } from '../useCursorPagination';

describe(useCursorPagination.name, () => {
  it('starts on the first page without a cursor', () => {
    const { result } = renderHook(() => useCursorPagination());

    expect(result.current.cursor).toBeUndefined();
    expect(result.current.pageNumber).toBe(1);
    expect(result.current.hasPreviousPage).toBe(false);
  });

  it('moves forward using the cursor of the next page', () => {
    const { result } = renderHook(() => useCursorPagination());

    act(() => result.current.goToNextPage('cursor-2'));

    expect(result.current.cursor).toBe('cursor-2');
    expect(result.current.pageNumber).toBe(2);
    expect(result.current.hasPreviousPage).toBe(true);
  });

  it('moves back to the previous cursor', () => {
    const { result } = renderHook(() => useCursorPagination());
    act(() => result.current.goToNextPage('cursor-2'));
    act(() => result.current.goToNextPage('cursor-3'));

    act(() => result.current.goToPreviousPage());

    expect(result.current.cursor).toBe('cursor-2');
    expect(result.current.pageNumber).toBe(2);
  });

  it('stays on the first page when going back from it', () => {
    const { result } = renderHook(() => useCursorPagination());

    act(() => result.current.goToPreviousPage());

    expect(result.current.cursor).toBeUndefined();
    expect(result.current.pageNumber).toBe(1);
  });
});
