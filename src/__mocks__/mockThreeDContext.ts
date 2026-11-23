import type { ThreeDModel } from '../types/threeD';
import type { ThreeDContextType } from '../types/threeDContext';

import { makeGlb, type FixtureNode } from './glb';
import { MOCK_LATENCY_MS, MOCK_PROJECT } from './mockAssetContext';

type Block = { size: readonly [number, number, number]; at: readonly [number, number, number] };

const BLOCKS: readonly Block[] = [
  { size: [40, 30, 2], at: [0, 0, -1] },
  { size: [6, 6, 20], at: [-10, -8, 10] },
  { size: [6, 6, 20], at: [10, -8, 10] },
  { size: [6, 6, 14], at: [-10, 8, 7] },
  { size: [6, 6, 14], at: [10, 8, 7] },
  { size: [30, 4, 3], at: [0, 0, 21] },
];

const BLOCK_COLORS: readonly (readonly [number, number, number])[] = [
  [0.4, 0.45, 0.5],
  [0.2, 0.6, 0.9],
  [0.9, 0.5, 0.2],
];

function boxNode(block: Block, index: number): FixtureNode {
  const [sizeX, sizeY, sizeZ] = block.size;
  const [atX, atY, atZ] = block.at;

  return {
    kind: 'instanced',
    name: 'BoxCollection',
    attributes: {
      _treeIndex: { size: 1, values: [index] },
      _color: { size: 3, values: BLOCK_COLORS[index % BLOCK_COLORS.length] },
      _instanceMatrix: {
        size: 16,
        values: [sizeX, 0, 0, 0, 0, sizeY, 0, 0, 0, 0, sizeZ, 0, atX, atY, atZ, 1],
      },
    },
  };
}

export function makeMockThreeDContext(latencyMs: number = MOCK_LATENCY_MS): ThreeDContextType {
  const sectors = BLOCKS.map((_block, index) => ({
    id: index,
    depth: 0,
    fileName: `${index}.glb`,
    downloadSize: 1,
  }));

  const model: ThreeDModel = {
    modelId: 1,
    revisionId: 1,
    name: 'Platform VPH',
    blobId: 1,
    rotation: null,
    scale: null,
    translation: null,
    scene: {
      unit: 'Meters',
      sectors,
      boundingBox: { min: [-20, -15, -2], max: [20, 15, 24] },
    },
  };

  return {
    project: MOCK_PROJECT,
    isSimulated: true,
    loadModel: () => delay(model, latencyMs),
    loadSector: (_blobId, fileName) => {
      const index = Number.parseInt(fileName, 10);

      return delay(makeGlb([boxNode(BLOCKS[index], index)]), latencyMs);
    },
  };
}

function delay<Value>(value: Value, ms: number): Promise<Value> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
