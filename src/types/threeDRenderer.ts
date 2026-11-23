import type { ThreeDInteractionMode } from '../enums/threeDInteractionMode';

import type { TessellatedMesh, ThreeDAssetLookup, ThreeDModel } from './threeD';

export interface ThreeDRenderer {
  addSector(mesh: TessellatedMesh): void;
  setAssetLookup(lookup: ThreeDAssetLookup): void;
  setInteractionMode(mode: ThreeDInteractionMode): void;
  zoomIn(): void;
  zoomOut(): void;
  resetView(): void;
  dispose(): void;
}

export type ThreeDRendererFactory = (container: HTMLElement, model: ThreeDModel) => ThreeDRenderer;
