import {
  THREE_D_MAX_DOWNLOAD_BYTES,
  THREE_D_SECTOR_CONCURRENCY,
  TRIANGLE_VERTEX_COUNT,
} from '../../constants/threeD';
import type { ThreeDLoadProgress, ThreeDModel, TessellatedMesh } from '../../types/threeD';
import type { ThreeDContextType } from '../../types/threeDContext';
import type { ThreeDRenderer } from '../../types/threeDRenderer';

import { parseSector } from './sectorParser';
import { tessellateSector } from './tessellateSector';

type SectorLoaderDeps = {
  parse: typeof parseSector;
  tessellate: (buffer: ArrayBuffer) => TessellatedMesh;
  yieldToBrowser: () => Promise<void>;
};

const defaultDeps: SectorLoaderDeps = {
  parse: parseSector,
  tessellate: (buffer) => tessellateSector(parseSector(buffer)),
  yieldToBrowser: () => new Promise((resolve) => setTimeout(resolve, 0)),
};

type LoadSectorsProps = {
  model: ThreeDModel;
  source: Pick<ThreeDContextType, 'loadSector'>;
  renderer: ThreeDRenderer;
  signal: AbortSignal;
  onProgress: (progress: ThreeDLoadProgress) => void;
};

export async function loadSectors(
  { model, source, renderer, signal, onProgress }: LoadSectorsProps,
  overrides?: Partial<SectorLoaderDeps>,
): Promise<ThreeDLoadProgress> {
  const { tessellate, yieldToBrowser } = { ...defaultDeps, ...overrides };
  const unsupported: Record<string, number> = {};

  const progress: ThreeDLoadProgress = {
    loadedSectors: 0,
    failedSectors: 0,
    skippedSectors: 0,
    totalSectors: model.scene.sectors.length,
    triangleCount: 0,
    unsupported,
  };

  let downloaded = 0;
  let next = 0;

  async function worker(): Promise<void> {
    while (!signal.aborted && next < model.scene.sectors.length) {
      const sector = model.scene.sectors[next];

      next += 1;

      if (downloaded + sector.downloadSize > THREE_D_MAX_DOWNLOAD_BYTES) {
        progress.skippedSectors += 1;
        onProgress({ ...progress });
        continue;
      }

      downloaded += sector.downloadSize;

      try {
        const buffer = await source.loadSector(model.blobId, sector.fileName);

        if (signal.aborted) return;

        const mesh = tessellate(buffer);

        renderer.addSector(mesh);
        progress.loadedSectors += 1;
        progress.triangleCount += mesh.indices.length / TRIANGLE_VERTEX_COUNT;

        Object.entries(mesh.unsupported).forEach(([name, count]) => {
          unsupported[name] = (unsupported[name] ?? 0) + count;
        });
      } catch {
        progress.failedSectors += 1;
      }

      onProgress({ ...progress, unsupported: { ...unsupported } });
      await yieldToBrowser();
    }
  }

  await Promise.all(Array.from({ length: THREE_D_SECTOR_CONCURRENCY }, worker));

  return { ...progress, unsupported: { ...unsupported } };
}
