import { describe, expect, it } from 'vitest';

import { decodePickColor, encodePickColor } from '../pickCodec';

describe('pick colour codec', () => {
  it.each([0, 1, 255, 256, 65_535, 65_536, 1_234_567, 16_777_214])(
    'gives back tree index %i',
    (treeIndex) => {
      const [red, green, blue] = encodePickColor(treeIndex);

      expect(decodePickColor(red, green, blue)).toBe(treeIndex);
    },
  );

  it('keeps tree index 0 apart from the empty background', () => {
    expect(encodePickColor(0)).not.toEqual([0, 0, 0]);
  });

  it('reads the empty background as no element', () => {
    expect(decodePickColor(0, 0, 0)).toBeNull();
  });

  it('writes each channel as a byte', () => {
    encodePickColor(1_234_567).forEach((channel) => {
      expect(Number.isInteger(channel)).toBe(true);
      expect(channel).toBeGreaterThanOrEqual(0);
      expect(channel).toBeLessThanOrEqual(255);
    });
  });
});
