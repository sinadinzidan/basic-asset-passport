import { describe, expect, it } from 'vitest';

import { dummyCriticality } from '../dummyCriticality';

describe(dummyCriticality.name, () => {
  it('gives the same asset the same class every time', () => {
    expect(dummyCriticality('WMT:23-TI-92524')).toBe(dummyCriticality('WMT:23-TI-92524'));
  });

  it('only ever gives class A, B or C', () => {
    const names = Array.from({ length: 50 }, (_unused, index) => `WMT:23-X-${index}`);

    names.forEach((name) => expect(['A', 'B', 'C']).toContain(dummyCriticality(name)));
  });

  it('spreads assets over all three classes', () => {
    const names = Array.from({ length: 60 }, (_unused, index) => `WMT:23-X-${index}`);

    expect(new Set(names.map(dummyCriticality)).size).toBe(3);
  });
});
