import { describe, expect, it } from 'vitest';

import { formatCount, formatTabCountBadge, toCountState } from '../countBadge';

describe(formatCount.name, () => {
  it('puts a thousands separator in large counts', () => {
    expect(formatCount(1000)).toBe('1,000');
  });

  it('leaves small counts as they are', () => {
    expect(formatCount(3)).toBe('3');
  });
});

describe(formatTabCountBadge.name, () => {
  it('reads the whole count, with a thousands separator', () => {
    expect(formatTabCountBadge({ count: 1234, isLoading: false })).toBe('1,234');
  });

  it('reads zero for a list with nothing in it', () => {
    expect(formatTabCountBadge({ count: 0, isLoading: false })).toBe('0');
  });

  it('reads nothing while the count is not known', () => {
    expect(formatTabCountBadge({ count: null, isLoading: true })).toBeUndefined();
    expect(formatTabCountBadge({ count: null, isLoading: false })).toBeUndefined();
  });
});

describe(toCountState.name, () => {
  it('is loading, with no count, while the count is being read', () => {
    expect(toCountState({ data: undefined, isPending: true })).toEqual({
      count: null,
      isLoading: true,
    });
  });

  it('holds the count once it is read', () => {
    expect(toCountState({ data: 12, isPending: false })).toEqual({ count: 12, isLoading: false });
  });

  it('holds no count when it could not be read', () => {
    expect(toCountState({ data: undefined, isPending: false })).toEqual({
      count: null,
      isLoading: false,
    });
  });
});
