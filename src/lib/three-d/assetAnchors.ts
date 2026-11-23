import type { Vector } from '../../types/threeD';

type Bounds = { min: [number, number, number]; max: [number, number, number] };

const COMPONENTS = 3;
const HALF = 0.5;
const Z_OFFSET = 2;

export function createAnchorAccumulator() {
  const bounds = new Map<number, Bounds>();

  function grow(asset: number, positions: Float32Array, offset: number): void {
    const existing = bounds.get(asset);

    if (existing === undefined) {
      const point: [number, number, number] = [
        positions[offset],
        positions[offset + 1],
        positions[offset + Z_OFFSET],
      ];

      bounds.set(asset, { min: [...point], max: [...point] });

      return;
    }

    for (let axis = 0; axis < COMPONENTS; axis += 1) {
      existing.min[axis] = Math.min(existing.min[axis], positions[offset + axis]);
      existing.max[axis] = Math.max(existing.max[axis], positions[offset + axis]);
    }
  }

  return {
    add(positions: Float32Array, assetIndices: Float32Array): void {
      assetIndices.forEach((asset, vertex) => {
        if (asset >= 0) grow(asset, positions, vertex * COMPONENTS);
      });
    },
    anchors(): Map<number, Vector> {
      return new Map(
        [...bounds].map(([asset, { min, max }]) => [
          asset,
          [
            (min[0] + max[0]) * HALF,
            (min[1] + max[1]) * HALF,
            (min[Z_OFFSET] + max[Z_OFFSET]) * HALF,
          ],
        ]),
      );
    },
    radii(): Map<number, number> {
      return new Map(
        [...bounds].map(([asset, { min, max }]) => [
          asset,
          Math.hypot(max[0] - min[0], max[1] - min[1], max[Z_OFFSET] - min[Z_OFFSET]) * HALF,
        ]),
      );
    },
    reset(): void {
      bounds.clear();
    },
  };
}
