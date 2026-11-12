import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useListLimit } from '../useListLimit';

describe(useListLimit.name, () => {
  it('starts at one page', () => {
    const { result } = renderHook(() => useListLimit(50));

    expect(result.current.limit).toBe(50);
  });

  it('reads one page further each time more is asked for', () => {
    const { result } = renderHook(() => useListLimit(50));

    act(() => result.current.showMore());
    act(() => result.current.showMore());

    expect(result.current.limit).toBe(150);
  });
});
