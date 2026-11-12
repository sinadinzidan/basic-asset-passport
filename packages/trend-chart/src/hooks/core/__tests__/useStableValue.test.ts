import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useStableValue } from '../useStableValue';

describe(useStableValue.name, () => {
  it('gives the value it was first handed', () => {
    const first = ['a', 'b'];

    const { result } = renderHook(() => useStableValue(first));

    expect(result.current).toBe(first);
  });

  it('keeps the earlier value while a new one holds the same data', () => {
    const first = [{ id: 'a' }];
    const { result, rerender } = renderHook(({ value }) => useStableValue(value), {
      initialProps: { value: first },
    });

    rerender({ value: [{ id: 'a' }] });

    expect(result.current).toBe(first);
  });

  it('gives the new value once the data has changed', () => {
    const changed = [{ id: 'b' }];
    const { result, rerender } = renderHook(({ value }) => useStableValue(value), {
      initialProps: { value: [{ id: 'a' }] },
    });

    rerender({ value: changed });

    expect(result.current).toBe(changed);
  });

  it('keeps the changed value while later ones hold the same data', () => {
    const changed = [{ id: 'b' }];
    const { result, rerender } = renderHook(({ value }) => useStableValue(value), {
      initialProps: { value: [{ id: 'a' }] },
    });
    rerender({ value: changed });

    rerender({ value: [{ id: 'b' }] });

    expect(result.current).toBe(changed);
  });

  it('gives a changed plain value as it is', () => {
    const { result, rerender } = renderHook(({ value }) => useStableValue(value), {
      initialProps: { value: 'one' },
    });

    rerender({ value: 'two' });

    expect(result.current).toBe('two');
  });
});
