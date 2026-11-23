import type { TessellatedMesh, ThreeDModel } from './threeD';

export interface ThreeDRenderer {
  addSector(mesh: TessellatedMesh): void;
  dispose(): void;
}

export type ThreeDRendererFactory = (container: HTMLElement, model: ThreeDModel) => ThreeDRenderer;
