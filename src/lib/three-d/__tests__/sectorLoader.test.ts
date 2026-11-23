import { describe, expect, it, vi } from 'vitest';

import { THREE_D_MAX_DOWNLOAD_BYTES } from '../../../constants/threeD';
import type { TessellatedMesh, ThreeDLoadProgress, ThreeDModel } from '../../../types/threeD';
import type { ThreeDRenderer } from '../../../types/threeDRenderer';
import { loadSectors } from '../sectorLoader';

const FAILING_FILE = '0.glb';

describe(loadSectors.name, () => {
  it('draws every sector and counts the triangles', async () => {
    const { renderer, run } = setup({ sectorCount: 3 });

    const result = await run();

    expect(renderer.addSector).toHaveBeenCalledTimes(3);
    expect(result).toMatchObject({ loadedSectors: 3, failedSectors: 0, triangleCount: 6 });
  });

  it('tessellates through the worker pool and disposes it when done', async () => {
    const pool = { tessellate: vi.fn(() => Promise.resolve(makeMesh({}))), dispose: vi.fn() };
    const { renderer, model, source, signal, onProgress } = setup({ sectorCount: 2 });

    await loadSectors(
      { model, source, renderer, signal, onProgress },
      { createPool: () => pool, yieldToBrowser: () => Promise.resolve() },
    );

    expect(pool.tessellate).toHaveBeenCalledTimes(2);
    expect(pool.dispose).toHaveBeenCalledOnce();
  });

  it('reports progress after each sector', async () => {
    const { onProgress, run } = setup({ sectorCount: 2 });

    await run();

    expect(onProgress.mock.calls.map(([progress]) => progress.loadedSectors)).toEqual([1, 2]);
  });

  it('counts a sector that cannot be read as failed and carries on', async () => {
    const { renderer, run } = setup({
      sectorCount: 2,
      loadSector: (_blobId, fileName) =>
        fileName === FAILING_FILE
          ? Promise.reject(new Error('boom'))
          : Promise.resolve(new ArrayBuffer(1)),
    });

    const result = await run();

    expect(result).toMatchObject({ loadedSectors: 1, failedSectors: 1 });
    expect(renderer.addSector).toHaveBeenCalledTimes(1);
  });

  it('skips the sectors beyond the download budget', async () => {
    const { run } = setup({ sectorCount: 3, downloadSize: THREE_D_MAX_DOWNLOAD_BYTES });

    const result = await run();

    expect(result).toMatchObject({ loadedSectors: 1, skippedSectors: 2 });
  });

  it('adds up the shapes it cannot draw', async () => {
    const { run } = setup({ sectorCount: 2, unsupported: { Foo: 2 } });

    const result = await run();

    expect(result.unsupported).toEqual({ Foo: 4 });
  });

  it('stops when it is aborted', async () => {
    const controller = new AbortController();

    controller.abort();
    const { renderer, run } = setup({ sectorCount: 3, signal: controller.signal });

    await run();

    expect(renderer.addSector).not.toHaveBeenCalled();
  });
});

type SetupOptions = {
  sectorCount: number;
  downloadSize?: number;
  unsupported?: Record<string, number>;
  signal?: AbortSignal;
  loadSector?: (blobId: number, fileName: string) => Promise<ArrayBuffer>;
};

function setup({
  sectorCount,
  downloadSize = 1,
  unsupported = {},
  signal = new AbortController().signal,
  loadSector = () => Promise.resolve(new ArrayBuffer(1)),
}: SetupOptions) {
  const renderer = {
    addSector: vi.fn(),
    dispose: vi.fn(),
    setAssetLookup: vi.fn(),
    setInteractionMode: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    resetView: vi.fn(),
  } satisfies ThreeDRenderer;
  const onProgress = vi.fn<(progress: ThreeDLoadProgress) => void>();
  const model = makeModel(sectorCount, downloadSize);

  return {
    renderer,
    onProgress,
    model,
    source: { loadSector },
    signal,
    run: () =>
      loadSectors(
        { model, source: { loadSector }, renderer, signal, onProgress },
        {
          tessellate: () => makeMesh(unsupported),
          yieldToBrowser: () => Promise.resolve(),
        },
      ),
  };
}

function makeModel(sectorCount: number, downloadSize: number): ThreeDModel {
  return {
    modelId: 1,
    revisionId: 1,
    name: 'Platform VPH',
    blobId: 9,
    rotation: null,
    scale: null,
    translation: null,
    scene: {
      unit: 'Meters',
      boundingBox: { min: [0, 0, 0], max: [1, 1, 1] },
      sectors: Array.from({ length: sectorCount }, (_unused, index) => ({
        id: index,
        depth: 0,
        fileName: `${index}.glb`,
        downloadSize,
      })),
    },
  };
}

function makeMesh(unsupported: Record<string, number>): TessellatedMesh {
  return {
    positions: new Float32Array(9),
    normals: new Float32Array(9),
    colors: new Float32Array(9),
    treeIndices: new Float32Array(3),
    indices: new Uint32Array([0, 1, 2, 0, 1, 2]),
    unsupported,
  };
}
