import { describe, expect, it } from 'vitest';

import { cn } from '../utils';

describe(cn.name, () => {
  it('joins class names and skips falsy values', () => {
    expect(cn('a', false, undefined, 'b')).toBe('a b');
  });

  it('lets a later Tailwind utility override a conflicting earlier one', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
});
