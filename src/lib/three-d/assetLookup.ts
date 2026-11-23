import { THREE_D_NO_ASSET } from '../../constants/threeD';
import type { ThreeDAssetLookup, ThreeDAssetNode } from '../../types/threeD';

type OwnedRange = { start: number; end: number; asset: number; parent: number };

function buildRanges(nodes: readonly ThreeDAssetNode[]): OwnedRange[] {
  const ranges = nodes
    .flatMap((node, asset) =>
      node.ranges.map(({ start, size }) => ({ start, end: start + size, asset, parent: -1 })),
    )
    .sort((first, second) => first.start - second.start || second.end - first.end);

  const open: number[] = [];

  ranges.forEach((range, index) => {
    while (open.length > 0 && ranges[open[open.length - 1]].end <= range.start) open.pop();

    range.parent = open.length > 0 ? open[open.length - 1] : -1;
    open.push(index);
  });

  return ranges;
}

function lastStartingAtOrBefore(ranges: readonly OwnedRange[], treeIndex: number): number {
  let low = 0;
  let high = ranges.length - 1;
  let found = -1;

  while (low <= high) {
    const middle = (low + high) >> 1;

    if (ranges[middle].start <= treeIndex) {
      found = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return found;
}

export function createAssetLookup(nodes: readonly ThreeDAssetNode[]): ThreeDAssetLookup {
  const ranges = buildRanges(nodes);

  function assetAt(treeIndex: number): number {
    let index = lastStartingAtOrBefore(ranges, treeIndex);

    while (index >= 0 && treeIndex >= ranges[index].end) index = ranges[index].parent;

    return index < 0 ? THREE_D_NO_ASSET : ranges[index].asset;
  }

  return {
    indicesFor: (treeIndices) => {
      const cache = new Map<number, number>();

      return Float32Array.from(treeIndices, (treeIndex) => {
        const cached = cache.get(treeIndex);

        if (cached !== undefined) return cached;

        const asset = assetAt(treeIndex);

        cache.set(treeIndex, asset);

        return asset;
      });
    },
    nameAt: (assetIndex) => nodes[assetIndex]?.name ?? null,
  };
}
