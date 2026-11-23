import { parseSector } from './sectorParser';
import { tessellateSector } from './tessellateSector';

self.onmessage = (event: MessageEvent<{ id: number; buffer: ArrayBuffer }>) => {
  const { id, buffer } = event.data;

  try {
    const mesh = tessellateSector(parseSector(buffer));

    self.postMessage(
      { id, mesh },
      {
        transfer: [
          mesh.positions.buffer,
          mesh.normals.buffer,
          mesh.colors.buffer,
          mesh.treeIndices.buffer,
          mesh.indices.buffer,
        ],
      },
    );
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : String(error) });
  }
};
