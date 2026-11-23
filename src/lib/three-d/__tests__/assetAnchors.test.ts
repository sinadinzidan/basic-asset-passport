import { describe, expect, it } from 'vitest';

import { createAnchorAccumulator } from '../assetAnchors';

describe(createAnchorAccumulator.name, () => {
  it('places an asset at the centre of its geometry', () => {
    const accumulator = createAnchorAccumulator();

    accumulator.add(new Float32Array([0, 0, 0, 2, 4, 6]), new Float32Array([0, 0]));

    expect(accumulator.anchors().get(0)).toEqual([1, 2, 3]);
  });

  it('ignores geometry that belongs to no asset', () => {
    const accumulator = createAnchorAccumulator();

    accumulator.add(new Float32Array([5, 5, 5]), new Float32Array([-1]));

    expect(accumulator.anchors().size).toBe(0);
  });

  it('keeps growing an asset across sectors', () => {
    const accumulator = createAnchorAccumulator();

    accumulator.add(new Float32Array([0, 0, 0]), new Float32Array([3]));
    accumulator.add(new Float32Array([10, 0, 0]), new Float32Array([3]));

    expect(accumulator.anchors().get(3)).toEqual([5, 0, 0]);
  });

  it('keeps assets apart', () => {
    const accumulator = createAnchorAccumulator();

    accumulator.add(new Float32Array([0, 0, 0, 8, 8, 8]), new Float32Array([0, 1]));

    expect(accumulator.anchors().get(0)).toEqual([0, 0, 0]);
    expect(accumulator.anchors().get(1)).toEqual([8, 8, 8]);
  });

  it('forgets everything on reset', () => {
    const accumulator = createAnchorAccumulator();

    accumulator.add(new Float32Array([1, 1, 1]), new Float32Array([0]));
    accumulator.reset();

    expect(accumulator.anchors().size).toBe(0);
  });
});
