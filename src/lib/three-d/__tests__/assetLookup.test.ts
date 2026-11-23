import { describe, expect, it } from 'vitest';

import type { ThreeDAssetNode } from '../../../types/threeD';
import { createAssetLookup } from '../assetLookup';

const NONE = -1;

function node(key: string, ...ranges: Array<[number, number]>): ThreeDAssetNode {
  return { key, name: key, ranges: ranges.map(([start, size]) => ({ start, size })) };
}

describe(createAssetLookup.name, () => {
  it('numbers the assets in the order given', () => {
    const lookup = createAssetLookup([node('a', [10, 1]), node('b', [20, 1])]);

    expect(Array.from(lookup.indicesFor(new Float32Array([10, 20])))).toEqual([0, 1]);
  });

  it('gives every node of a subtree the asset of the subtree root', () => {
    const lookup = createAssetLookup([node('a', [10, 5])]);

    expect(Array.from(lookup.indicesFor(new Float32Array([10, 12, 14])))).toEqual([0, 0, 0]);
  });

  it('gives nodes outside every range no asset', () => {
    const lookup = createAssetLookup([node('a', [10, 5])]);

    expect(Array.from(lookup.indicesFor(new Float32Array([9, 15, 100])))).toEqual([
      NONE,
      NONE,
      NONE,
    ]);
  });

  it('prefers the innermost asset when subtrees are nested', () => {
    const lookup = createAssetLookup([node('outer', [0, 100]), node('inner', [40, 10])]);

    expect(Array.from(lookup.indicesFor(new Float32Array([5, 45, 50, 60])))).toEqual([0, 1, 0, 0]);
  });

  it('reads an asset made of several ranges', () => {
    const lookup = createAssetLookup([node('a', [10, 2], [50, 2])]);

    expect(Array.from(lookup.indicesFor(new Float32Array([11, 30, 51])))).toEqual([0, NONE, 0]);
  });

  it('gives no asset to anything when there are no nodes', () => {
    expect(Array.from(createAssetLookup([]).indicesFor(new Float32Array([1, 2])))).toEqual([
      NONE,
      NONE,
    ]);
  });

  it('reads the same tree index the same way every time it appears', () => {
    const lookup = createAssetLookup([node('a', [7, 1])]);

    expect(Array.from(lookup.indicesFor(new Float32Array([7, 3, 7])))).toEqual([0, NONE, 0]);
  });

  it('names the asset at an index', () => {
    const lookup = createAssetLookup([node('a', [1, 1]), node('b', [2, 1])]);

    expect(lookup.nameAt(1)).toBe('b');
    expect(lookup.nameAt(NONE)).toBeNull();
  });
});
